# CI y calidad (tarea #84)

Workflow: `.github/workflows/ci.yml`. Corre en cada PR y en cada push a `main`.

| Job | Qué hace | Bloquea |
|---|---|---|
| `backend` | MySQL 8 de servicio, PHP 8.4 (igual que producción) + pcov, `phpunit --coverage-text`; sube `coverage.xml` y resumen en el Job Summary | sí |
| `frontend` | Node 20, `npm ci && npm run build` | sí |
| `audit` | `composer audit --locked` y `npm audit --omit=dev` | no (`continue-on-error`) hasta cerrar el plan de abajo |

Local: `make test-ci` (mismo gate que el deploy).

## Cobertura (medida el 2026-10-29, `phpunit.xml` ahora define `<source>` = `app/`)

- Backend: **35 tests / 112 aserciones**, 4 archivos Feature (Admin CRUD, Auth, endpoints públicos, heartbeat).
- Clases 5,8 % (3/52) · Métodos 17,3 % (42/243) · **Líneas 26,9 % (765/2842)**.
- Frontend: sin tests ni runner (solo se verifica que compile).
- Sin umbral mínimo todavía: se fija cuando haya una base útil (propuesta: ≥40 % de líneas, y que no baje).

## Auditoría de dependencias

Resuelto en esta tarea: `symfony/mime` (CVE-2026-45070) con `composer update symfony/mime`; `npm audit fix` (16 → 4 hallazgos; build y tests verdes).

Pendiente (requiere cambios mayores, tareas aparte):
1. `vite` ≤6.4.3 (high) y `esbuild` (moderate, solo dev server): subir Vite 5 → 6.4.4+ (o 7/8) y `@vitejs/plugin-react`. Solo afecta el servidor de desarrollo, no el bundle de producción.
2. `react-router` / `react-router-dom` (moderate): 6 → 7. Revisar rutas y futuras flags.
3. Cuando 1 y 2 estén hechos, quitar `continue-on-error` del job `audit`.
