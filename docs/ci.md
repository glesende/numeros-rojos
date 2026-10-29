# CI y calidad (tarea #84)

Workflow: `.github/workflows/ci.yml`. Corre en cada PR y en cada push a `main`.

| Job | Qué hace | Bloquea |
|---|---|---|
| `backend` | MySQL 8 de servicio, PHP 8.4 (igual que producción) + pcov, `phpunit --coverage-text`; **falla si las líneas cubiertas bajan de 40 %**; sube `coverage.xml` y resumen en el Job Summary | sí |
| `frontend` | Node 20, `npm ci && npm run build` | sí |
| `audit` | `composer audit --locked` y `npm audit` (incluye devDependencies) | sí |

Local: `make test-ci` (mismo gate que el deploy).

## Cobertura (medida el 2026-10-29, tarea #91)

- Backend: **70 tests / 329 aserciones**. Líneas **48,0 % (1393/2904)**, antes 28,4 %.
- Umbral en CI: **40 % de líneas** (paso "Umbral mínimo de cobertura" del job `backend`). Subirlo cuando la cobertura real lo permita; no bajarlo.
- Controladores públicos priorizados: Election 98,9 %, Balance 97,4 %, Bcra 100 %, Contract 80,4 % (ya estaba cubierto).
- Pendientes de bajo cobertura: Rumor 46 %, Settings 20 %, Stadium 15 %, Sitemap 53 %, `BeSoccerService` 7 % (servicio externo, requiere fakes HTTP).
- Frontend: sin tests ni runner (solo se verifica que compile). Fuera de alcance.
- Correr cobertura local: la imagen de `make test-ci` no trae pcov; usar `docker-php-ext-enable pcov` en una imagen derivada.

## Auditoría de dependencias

Todos los hallazgos están resueltos y el job `audit` es bloqueante:

- `symfony/mime` (CVE-2026-45070): `composer update symfony/mime` (tarea #84).
- `react-router-dom` 6 → 7.18.5 (GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg): el código solo usa `BrowserRouter`/rutas/hooks básicos, sin cambios de código; build OK.
- `vite` 5 → 6.4.x y `@vitejs/plugin-react` 4.7 (vite ≤6.4.3 high, esbuild moderate): solo afectaban al servidor de desarrollo.
- Resultado: `composer audit --locked` y `npm audit` en 0 hallazgos. Si aparece uno nuevo, el CI falla: resolverlo (o justificarlo y documentarlo antes de ignorarlo con una excepción explícita).
