# Métricas de uso por sección

Panel: `/admin/uso` (link «Uso del sitio» en `/admin`). Responde qué sección tiene más audiencia sin pedir nada a ingeniería.

## Qué muestra
Por sección y por ventana de 7 o 30 días: **visitas**, **usuarios únicos** y **% que vuelve**, más el total del sitio. Ordenado por usuarios únicos.
- *Vuelve*: visitante único que entró a esa sección en 2 o más días distintos dentro de la ventana (a nivel sitio: en 2+ días a cualquier sección).
- Secciones: `home`, `economia`, `contratos`, `balances`, `estadisticas`, `estadio`, `derechos`, `elecciones` (incluye `/mis-propuestas-2026`), `bcra` (`/deudas-bancarias`), `rumores`.
- **«Mercado» no es una sección aparte**: el mercado de pases y los rumores viven en el mismo bloque de la home, y se cuentan como `rumores` cuando el bloque entra en pantalla (IntersectionObserver), no al cargar la home.
- Las pantallas `/admin/*` no se miden. Datos desde el deploy que activó la medición (no hay histórico).

## Atribución de origen (utm)
Los links de difusión llevan `?utm_source=<canal>&utm_medium=organico&utm_campaign=<pieza>` (ej. `/balances/16?utm_source=x&utm_medium=organico&utm_campaign=balance2526`).
- `usePageTracking` manda, **solo en la primera página de cada sesión** (flag en `sessionStorage`, `nr_session`), un `POST /api/v1/analytics/origin` con la página de entrada (solo `pathname`, sin query) y los tres `utm_*`. Las pantallas `/admin` no se miden.
- En `/admin/uso` aparecen dos bloques: **Origen del tráfico** (agrupado por `utm_source` + `utm_campaign`, con medium, sesiones, únicos y % que vuelve; las sesiones sin utm quedan como «directo / sin utm») y **Páginas de entrada** (top 15). Misma ventana de 7/30 días.
- «% que vuelve» por origen: visitantes que entraron con ese origen y tuvieron visitas en 2+ días distintos de la ventana (según `page_views`).
- Sanitización: los utm se pasan a minúsculas y solo se aceptan `[a-z0-9_.-]` hasta 50 caracteres; si no cumplen se guardan vacíos (no se rechaza la visita). `entry_path` debe ser un path simple (`/a-z0-9_-/.`, ≤120).
- Tabla `visit_origins`: una fila por (visitante hash, día, source, medium, campaign, entry_path) con contador de sesiones. Misma política de privacidad (sin IP/UA/referrer) y misma retención de 90 días (`analytics:prune`).

## Privacidad
- El navegador genera un UUID aleatorio en `localStorage` (`nr_visitor`); no es cookie ni se deriva de nada personal.
- El backend guarda solo `HMAC-SHA256(uuid, APP_KEY)`; **no lee ni guarda IP, user-agent ni referrer**. Si cambia `APP_KEY` los hashes viejos dejan de coincidir (se corta el «vuelve» de esa ventana; no es un problema de seguridad).
- Tabla `page_views`: una fila por (sección, visitante, día) con un contador. `analytics:prune` (diario 04:30) borra lo de más de 90 días.
- Rate limit simple: 60 eventos/minuto por visitante (cache).

## Piezas
- Front: `frontend/src/utils/analytics.js`, `hooks/usePageTracking.js`, `pages/AdminUsagePage.jsx`.
- API: `POST /api/v1/analytics/view` (público, 202), `POST /api/v1/analytics/origin` (público, 202) y `GET /api/v1/admin/analytics/summary?days=7|30` (JWT).
- Back: `AnalyticsController`, `PageView`, `VisitOrigin`, `AnalyticsPruneCommand`, migraciones `2026_10_29_000002_create_page_views_table` y `2026_10_30_000001_create_visit_origins_table`.
- Test: `backend/tests/Feature/AnalyticsTest.php`.

## Rollback
Código: `scripts/rollback-remote.sh <TAG>`; con la migración: `--migrations` (el `down()` solo borra `visit_origins`, datos de métricas descartables). Ver `docs/operacion.md`.
