---
name: election-proposals-commitments
description: Use when loading a political list's ("lista electoral") proposals into the "Elecciones" section of Números Rojos — extracting proposals verbatim from a source (website, PDF, press release) and identifying which parts are "compromisos comprobables" (checkable commitments) to load into the election_commitments table. Triggers on requests like "cargá las propuestas de la lista X", "analizá las propuestas de <URL>", "creá los compromisos para esta lista".
---

# Propuestas y compromisos comprobables de listas electorales

## Cuándo usar esta skill
Cuando haya que cargar en Números Rojos las propuestas de una lista que se postula en la sección "Elecciones" (`election_lists` / `election_proposals` / `election_commitments`), a partir de una fuente externa (sitio web de la lista, PDF, gacetilla, etc.).

## Proceso

### 1. Obtener el contenido fuente completo, verbatim
- Si el sitio tiene tabs/categorías que cambian el contenido por JS o query param (ej. `?area=1..12`), **no asumas que un solo fetch trae todo**. Probá cada variante de URL/tab antes de dar por completo el relevamiento.
- `WebFetch` resume el contenido con un modelo chico — sirve para orientarse, pero **no uses su resumen como fuente final**. Traé el HTML crudo con `curl` (con User-Agent de navegador si hace falta) y limpiá a texto plano vos mismo (sacar `<script>`/`<style>`, poner salto de línea en tags de bloque, hacer unescape de entidades HTML) para poder citar el texto exacto.
- Guardá el texto crudo en el scratchpad antes de transcribir — vas a necesitar volver a citarlo en la auditoría del paso 4.

### 2. Transcribir las propuestas verbatim
- `title` = encabezado tal cual lo puso la lista.
- `description` = desarrollo completo, verbatim (sin resumir ni corregir redacción salvo tipeos evidentes de la fuente).
- Si la fuente agrupa las propuestas por área/categoría, prefijá el título (`"{Área} · {Título}"`) para no perder esa estructura al aplanarlas en la tabla `election_proposals`.

### 3. Extraer compromisos comprobables (el paso crítico)

Un **compromiso comprobable** es una oración autocontenida que describe UNA acción concreta cuyo cumplimiento se pueda verificar sin lugar a debate — con o sin cifra numérica.

**Regla de oro (aplicar SIEMPRE, es el error más común):** nombrar algo que se va a crear NO alcanza por sí solo. Hace falta que el texto de la propuesta explique qué hace, qué incluye o qué alcance tiene esa cosa — si la fuente solo le pone un nombre y no dice nada más, **no es un compromiso, se descarta**.

Ejemplos reales de esta skill (numerosrojos, lista "Gente de Independiente"):
- ❌ "Creación del programa 'Jugadores Embajadores'" — la propuesta lo menciona en una enumeración y no dice qué hace el programa. Se descarta.
- ❌ "Ejecución de obras y mejoras en el Estadio Libertadores de América, los predios de Wilde y Villa Domínico..." — nombra lugares pero no dice qué obras ni en qué plazo. Enumerar ubicaciones no es describir la acción. Se descarta.
- ❌ "Creación del Museo CAI, físico y virtual" — mencionado de pasada junto a otras cosas, sin ningún detalle de qué tendría el museo. Se descarta.
- ✅ "Desarrollo de una plataforma digital exclusiva para peñas (información, trámites, calendarios, actividades y comunicaciones oficiales)" — dice qué hace la plataforma.
- ✅ "Lanzamiento de RojoPay ... con meta de 30% de adopción entre socios activos ... durante el primer año" — tiene alcance + métrica embebida en el texto.
- ✅ "Definición y publicación de un organigrama de cabezas de área (coordinadores de Fútbol Juvenil e Infantil, Preparadores Físicos, scouting, metodología...)" — el detalle entre paréntesis es lo que lo hace comprobable.

**Otras reglas:**
- Cuando la propuesta describe varias sub-features de UNA sola cosa (ej. el portal de peñas: trámites + calendarios + comunicaciones), se agrupan en UN compromiso — no se explota cada feature en una fila.
- Cuando la propuesta nombra 2+ cosas genuinamente independientes y cada una tiene desarrollo propio en el texto, van como compromisos separados. Si dos menciones son en realidad la misma creación institucional vista desde dos ángulos (ej. "crear la Secretaría Técnica" + "designar un Director Deportivo que la lidera", cuando el Director es la cabeza de esa misma Secretaría), se **fusionan en un solo compromiso**.
- El texto del compromiso debe incluir en sí mismo la forma de evaluarlo (no hay campos estructurados de unidad/valor en el schema — ver "Modelo de datos"). Sumá al compromiso el detalle concreto que la propuesta sí da (cifras, plazos, alcance, composición), no te quedes solo con el nombre de la cosa si la fuente da más.
- Nunca inventes contenido que la fuente no tiene. Es preferible que una propuesta quede con 0 compromisos a que se le atribuya uno que no está sustentado en el texto.

### 4. Auditoría obligatoria de segunda pasada
Después de la primera extracción, releé cada compromiso propuesto y preguntate:

> **"¿Alguien que lea SOLO esta oración, sin el resto de la propuesta, podría decir con certeza si se cumplió o no?"**

Si la respuesta depende de información que la propuesta no da (qué obra puntual, qué hace el programa, en qué plazo), el compromiso se descarta o se reformula solo con lo que la fuente sí sostiene. Esta auditoría no es opcional — la primera pasada de extracción tiende a ser demasiado permisiva (confundir "le pusieron un nombre" con "es medible").

## Modelo de datos (numeros-rojos)
- `election_lists`: id, name, logo_path/logo_original_name.
- `election_proposals`: id, election_list_id (FK), title, description, order. **Sin `unit`/`unit_value`** — esos campos se removieron; toda la "forma de evaluar" vive como texto libre dentro de `election_commitments.description`.
- `election_commitments`: id, election_proposal_id (FK, cascadeOnDelete), description (texto libre autocontenido), order.

## Carga a la base
1. La lista (`election_lists`) se crea desde `/admin/elecciones` (nombre + logo) — no hace falta SQL para esto.
2. Generar el INSERT de `election_proposals` en Python (no a mano): un dict/list con `(area, title, description)`, escapando `'` → `''` y `\` → `\\` al armar el SQL.
3. Generar el INSERT de `election_commitments` referenciando el proposal vía subquery `(SELECT id FROM election_proposals WHERE election_list_id = X AND title = '...' LIMIT 1)` — evita tener que hardcodear IDs y es robusto a reinserciones.
4. **Ejecutar el `.sql` con `mysql --default-character-set=utf8mb4 ...`**. Sin este flag los acentos se corrompen (mojibake) — ya pasó una vez en esta base.
5. Verificar: contar filas, chequear que no haya `election_proposal_id IS NULL` (indicaría un título que no matcheó por typo), y pegarle a `GET /api/v1/elections` para confirmar que el JSON público se ve bien (acentos incluidos).
6. Si hay que corregir/reemplazar compromisos ya cargados para una lista, lo más simple es `DELETE FROM election_commitments WHERE election_proposal_id IN (SELECT id FROM election_proposals WHERE election_list_id = X)` y volver a insertar todo el set revisado — más simple y menos propenso a errores que actualizar fila por fila.

## Historial de aprendizajes
- **2026-08-25 (carga inicial):** primera carga de "Gente de Independiente" (79 propuestas, 12 áreas, sitio con tabs por `?area=1..12`). Primer criterio de "medible" fue solo numérico (2 de 79) → se amplió a "creación de algo concreto" (65 compromisos en 55 propuestas) → **se detectó que ese criterio era demasiado permisivo**: aceptaba compromisos que solo nombraban algo sin explicar qué hacía ("Creación del programa Jugadores Embajadores", "Ejecución de obras... en el Estadio, Wilde, Villa Domínico..."). Se agregó la "regla de oro" del paso 3 y la auditoría del paso 4, y se recargaron los compromisos de esa lista con el criterio corregido.
