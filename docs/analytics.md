# Métricas de uso por sección

Panel: `/admin/uso` (link «Uso del sitio» en `/admin`). Responde qué sección tiene más audiencia sin pedir nada a ingeniería.

## Qué muestra
Por sección y por ventana de 7 o 30 días: **visitas**, **usuarios únicos** y **% que vuelve**, más el total del sitio. Ordenado por usuarios únicos.
- *Vuelve*: visitante único que entró a esa sección en 2 o más días distintos dentro de la ventana (a nivel sitio: en 2+ días a cualquier sección).
- Secciones: `home`, `economia`, `contratos`, `balances`, `estadisticas`, `estadio`, `derechos`, `elecciones` (incluye `/mis-propuestas-2026`), `bcra` (`/deudas-bancarias`), `rumores`.
- **«Mercado» no es una sección aparte**: el mercado de pases y los rumores viven en el mismo bloque de la home, y se cuentan como `rumores` cuando el bloque entra en pantalla (IntersectionObserver), no al cargar la home.
- Las pantallas `/admin/*` no se miden. Datos desde el deploy que activó la medición (no hay histórico).

## Privacidad
- El navegador genera un UUID aleatorio en `localStorage` (`nr_visitor`); no es cookie ni se deriva de nada personal.
- El backend guarda solo `HMAC-SHA256(uuid, APP_KEY)`; **no lee ni guarda IP, user-agent ni referrer**. Si cambia `APP_KEY` los hashes viejos dejan de coincidir (se corta el «vuelve» de esa ventana; no es un problema de seguridad).
- Tabla `page_views`: una fila por (sección, visitante, día) con un contador. `analytics:prune` (diario 04:30) borra lo de más de 90 días.
- Rate limit simple: 60 eventos/minuto por visitante (cache).

## Piezas
- Front: `frontend/src/utils/analytics.js`, `hooks/usePageTracking.js`, `pages/AdminUsagePage.jsx`.
- API: `POST /api/v1/analytics/view` (público, 202) y `GET /api/v1/admin/analytics/summary?days=7|30` (JWT).
- Back: `AnalyticsController`, `PageView`, `AnalyticsPruneCommand`, migración `2026_10_29_000002_create_page_views_table`.
- Test: `backend/tests/Feature/AnalyticsTest.php`.

## Rollback
Código: `scripts/rollback-remote.sh <TAG>`; con la migración: `--migrations` (el `down()` solo borra `page_views`, datos de métricas descartables). Ver `docs/operacion.md`.
