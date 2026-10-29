# Números Rojos — contexto para agentes

Punto de entrada. Detalle de operación en `docs/operacion.md`; backlog de la admisión en `docs/backlog-inicial.md`.
Última verificación: 2026-10-29 (Admisión). Lo que no se pudo verificar está marcado **[sin verificar]**.

## Producto
Portal de transparencia del Club Atlético Independiente (Argentina): economía (cobros/pagos, deudas bancarias, cheques rechazados, balances), contratos de jugadores, derechos, rumores/mercado, elecciones y compromisos de candidatos, cotizaciones USD. Público: socios e hinchas (lectura abierta); un admin carga y edita datos. Está **en producción y activo** en https://numerosrojos.net (tag `1.38.0`, 2026-10-22). Open source (MIT), pensado para replicarse en otros clubes.

## Arquitectura
- **Backend** `backend/`: Laravel 13.38 / PHP 8.4 (migrado desde Lumen en 1.38.0; la estructura de `routes/api.php` y `bootstrap/app.php` aún es estilo Lumen). Auth admin con JWT (`tymon/jwt-auth`). MySQL 8, Redis 7. API pública bajo `/api/v1` (rutas en `backend/routes/api.php`).
- **Frontend** `frontend/`: React 18 + Vite 5 + Tailwind 3.4 + Recharts. `src/pages`, `components`, `api/endpoints.js`, `context/AuthContext`.
- **Contenedores** (`docker-compose.prod.yml`): `api` (nginx + php-fpm + **scheduler** bajo supervisord), `frontend` (nginx con el build), `mysql`, `redis`.
- **Integraciones externas:** API del BCRA (deudas, cheques rechazados, cotizaciones USD), BeSoccer (stats; opcional, caché en Redis), SMTP (contacto), Google Analytics (`VITE_GA_MEASUREMENT_ID`), monitor de cuentas de X (`MonitorXAccountsCommand`, hoy deshabilitado en el scheduler).
- **Procesos automatizados** (`backend/app/Console/Kernel.php`, los dispara `php artisan schedule:work` dentro del contenedor `api`, sin cron del host):
  | Comando | Cuándo | Qué hace |
  |---|---|---|
  | `bcra:sync-debts` | día 1, 03:00 | deudas bancarias del club |
  | `bcra:sync-checks` | día 1, 03:10 | cheques rechazados |
  | `bcra:sync-quotes` | lunes 04:00 | cotizaciones USD (`usd_quotes`) |
  Los logs de cada uno van a `storage/logs/bcra-*.log` (volumen `storage-logs`, persiste entre deploys; los de php-fpm y del scheduler, en el volumen `php-logs` → `/var/log/php-fpm/`).
  **Latido:** cada ejecución de un `bcra:sync-*` (programada o manual) queda en la tabla `scheduled_job_runs` (inicio, fin, `status` running/success/failed, `exit_code`; listener `App\Support\RecordScheduledJobRun`). `php artisan bcra:heartbeat failed|stale-days` imprime la métrica que lee el monitoreo de la oficina.
- Tarjetas para compartir (og:tags + imagen por balance/contrato/lista): ver `docs/compartir.md`.
- Hay además comandos `voto:*` y `docker/belenios` (prototipo de voto remoto, rama `voto-remoto`, **no está en `main` ni en producción**).

## Desarrollo local
- `make setup && make build && make up && make migrate && make seed` (Docker). Frontend http://localhost:5173, API http://localhost:8080. Admin de dev: `admin@numerosrojos.ar` / `password` (solo local; en producción **no** rige: verificado).
- Tests: `make test` (PHPUnit 12 en el contenedor `api`; 3 archivos en `backend/tests/Feature`: Auth, AdminCrud, PublicEndpoints; usan la BD `numeros_rojos_testing`, que crea `docker/mysql/init.sql`). **[sin verificar: no se corrieron en la admisión]**
- Frontend: `npm run build` (en `frontend/`). No hay linter ni tests de frontend.
- **El checkout local `/home/glesende/development/numeros-rojos` puede estar en una rama de trabajo con cambios sin commitear (al 2026-10-29: `voto-remoto`, 9 archivos modificados, del CEO). No lo toques ni lo descartes; trabajá en un `git worktree` de `origin/main`.**

## Producción
Resumen; paso a paso en `docs/operacion.md`.
- VPS `ubuntu@148.113.207.54` (compartido con otros proyectos), código en `/home/ubuntu/projects/numeros-rojos` (checkout del tag, HEAD detached), secretos en `.env.prod` (sin versionar). nginx del host + certbot: `numerosrojos.net` → `/api` a `localhost:8085`, resto a `localhost:3005`.
- Deploy: `make deploy TAG=x.y.z` (usa `.env.local`: `SERVER`, `DEPLOY_PATH`). Corre `make test-ci` (aborta si falla), hace backup, construye antes de bajar, smoke test y revierte solo si falla (`scripts/deploy-remote.sh`; rollback manual: `scripts/rollback-remote.sh`). Detalle en `docs/operacion.md`.
- Verificación: `https://numerosrojos.net/` → 200; `https://numerosrojos.net/api/` → JSON `{"status":"running"}`; `https://numerosrojos.net/api/api/v1/contracts/stats` → 200.
- Logs: `docker logs numeros-rojos-api-1` casi no muestra nada útil; los reales están en el contenedor (`/var/log/php-fpm/{access,error,scheduler}.log` y `storage/logs/`, ambos en volúmenes persistentes desde 2026-10-29; `/var/log/nginx/` no).
- **No hay backup de la base de datos** (ni cron ni dumps). Antes de cualquier migración destructiva hay que volcar a mano (ver `docs/operacion.md`).
- Monitoreo: `config/proyectos/numeros-rojos.toml` en la oficina (sitio, API, contenedores, scheduler vivo, antigüedad de cotizaciones).

## Convenciones
- Ramas por tarea `task-NNNN-slug`; el historial es de commits en español, tags semver anotados por release. Trabajo directo a `main` solo para documentación.
- Colores y estilos: tokens centralizados en `tailwind.config.js` / clases `badge-*`; no hardcodear colores (hubo varias tareas de migración a tokens).
- Textos de UI en español rioplatense.

## Salud del proyecto
- Tests: 3 archivos Feature de backend; sin tests de frontend; cobertura sin medir. **Sin CI** (`.github/` solo tiene plantillas).
- Backups: ninguno. Alertas de scheduler: ninguna antes de esta admisión.
- Seguridad: ver urgentes en el backlog (puertos de MySQL/Redis expuestos a internet, Redis sin contraseña, secretos débiles en `.env.prod`).
- Deuda: `CLAUDE.md` era una plantilla vacía; ~90 ramas `task-*` remotas viejas; README desactualizado (dice Lumen); `docker-compose.yml` de dev expone credenciales por defecto.
- Dependencias vulnerables/desactualizadas: **[sin verificar]** (`composer audit` y `npm audit` no se corrieron).
