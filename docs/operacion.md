# Operación en producción (runbook)

Sin secretos: están en `.env.prod` del VPS. Lo ejecuta el ingeniero de la compañía de forma autónoma desde la PC de la oficina (hay clave SSH sin passphrase al VPS, Docker local y `.env.local` con `SERVER=ubuntu@148.113.207.54`, `DEPLOY_PATH=/home/ubuntu/projects/numeros-rojos`). Nada de esto requiere al CEO.
Verificado el 2026-10-29. El deploy seguro y el rollback se ensayaron (tarea #81, abajo); el restore de DB no.

## Estado actual
VPS único compartido. Contenedores `numeros-rojos-{api,frontend,mysql,redis}-1` (Up, restart `unless-stopped`), volúmenes `numeros-rojos_mysql-data` y `numeros-rojos_storage-data`. Puertos publicados en el host: api 8085, frontend 3005, mysql 3309, redis 16379. Versión: tag `1.38.0` (Laravel 13.38, PHP 8.4.27).

## Deploy (`make deploy TAG=x.y.z`)
Precondiciones: copia limpia de `main` (no el checkout local con trabajo sin commitear: el target aborta si hay cambios trackeados sin commitear), Docker andando, `.env.local` con `SERVER` y `DEPLOY_PATH`.
1. TAG = siguiente semver: `git fetch --tags; git tag --sort=-v:refname | head -1`.
2. Mirar si trae migraciones: `git diff --stat <último-tag>..main -- backend/database/migrations`. El backup lo hace el propio deploy (paso 4); si hay una migración destructiva, revisá además que el `down()` sea reversible.
3. `make deploy TAG=x.y.z` (`make -n deploy TAG=x.y.z` muestra qué haría). Orden: mergea/actualiza `main` → **`make test-ci`** (construye la imagen del api, levanta un MySQL efímero con `numeros_rojos_testing`, corre phpunit y luego `npm ci && npm run build` del frontend; ~2-3 min) → **si falla, no se pushea, no se taggea y no se despliega** → push de `main` y del tag anotado → en el VPS `scripts/deploy-remote.sh`.
4. `scripts/deploy-remote.sh` (en el VPS, `PREV_REF` = commit anterior): `scripts/backup-db.sh` (dump validado; si falla, no se despliega) → **build con el stack viejo sirviendo** → `up -d` (recrea solo lo que cambió) → `migrate --force` → **smoke test** → `image prune` y `besoccer:warm-cache` (no bloqueante). Si el build falla, producción no se toca. Si `up`/migrate/smoke fallan, **vuelve solo** a `PREV_REF`, reconstruye y repite el smoke; sale con error y `make deploy` también.
5. **Smoke test** (espera hasta `SMOKE_TIMEOUT`=120 s cada chequeo): `https://numerosrojos.net/` 200; `/api/` con `"status":"running"`; `/api/api/v1/contracts/stats` 200 (toca la base); proceso `schedule:work` vivo en el contenedor `api`.
6. Las migraciones **no** se revierten solas (ver Rollback B/C). El tag queda pusheado aunque el deploy falle: el siguiente intento usa un tag nuevo.
7. Verificar (abajo) y registrar en la tarea tag y resultado.

## Verificación
- `curl -s -o /dev/null -w '%{http_code}\n' https://numerosrojos.net/` → 200
- `curl -s https://numerosrojos.net/api/` → `{"name":"Números Rojos API",…,"status":"running"}`
- `curl -s -o /dev/null -w '%{http_code}\n' https://numerosrojos.net/api/api/v1/contracts/stats` → 200
- `ssh ubuntu@148.113.207.54 'cd ~/projects/numeros-rojos && git describe --tags --exact-match && docker compose -f docker-compose.prod.yml --env-file .env.prod ps'` → tag desplegado y 4 contenedores Up (mysql y redis healthy).
- **Scheduler:** `docker exec numeros-rojos-api-1 sh -c 'ps | grep [s]chedule:work'` (1 proceso) y `docker exec numeros-rojos-api-1 php artisan schedule:list` (3 comandos BCRA). Repetirlo tras cada deploy: el contenedor `api` se recrea.
- Datos al día: `select max(quote_date) from usd_quotes` (normalmente ≤ ~6 días de atraso).

## Rollback
Se ejecuta en el VPS (`ssh $SERVER`, `cd $DEPLOY_PATH`) sin pedir permiso. Un deploy fallido ya se revierte solo (paso 4); esto es para volver atrás una versión que pasó el smoke pero está mal.
- **A. Solo código:** `scripts/rollback-remote.sh <TAG_ANTERIOR>` (`git tag --sort=-v:refname | head -3`). Checkout, build con el stack actual sirviendo, `up -d` y el mismo smoke; sale con error si no verifica. No usar `make deploy` (crea un tag nuevo).
- **B. Código + migraciones reversibles:** `scripts/rollback-remote.sh <TAG_ANTERIOR> --migrations`: antes de cambiar el código corre `migrate:rollback --force` (última tanda = la del último deploy) con el código nuevo todavía sirviendo (la imagen vieja no trae esas migraciones). Revisá el `down()`: si borra columnas/tablas con datos, usar C. Si el rollback de migraciones falla, el script aborta sin tocar el código.
- **C. Migración irreversible o datos dañados:** `docker compose -f docker-compose.prod.yml --env-file .env.prod stop api`; `scripts/restore-db.sh --prod <dump>` (`ls -t ~/backups/numeros-rojos`; el deploy deja un dump justo antes de cada release); luego `scripts/rollback-remote.sh <TAG_ANTERIOR>`. Los datos posteriores al dump se pierden; las tablas nuevas de la release quedan huérfanas (borrarlas a mano antes de re-desplegar). Ver `docs/backups.md`.

### Ensayado (tarea #81, 2026-10-29)
En un stack aislado en la PC de la oficina (`docker-compose.prod.yml` real, proxy nginx local imitando el del host, datos vacíos migrados). **No se tocó producción en el ensayo.**
- Deploy exitoso: backup → build → up → migrate → smoke OK. Corte medido con un sondeo de `contracts/stats` cada 1 s: **~3 s de 502** (recreación del api) en vez de minutos.
- Build roto (error de composer): el build falla, **producción siguió sirviendo 200** durante todo el intento.
- Falla en runtime (`/api/` lanza excepción): el smoke detectó el fallo, el script volvió solo a la versión anterior y el smoke volvió a pasar (~30 s con `SMOKE_TIMEOUT=20`; ~6 s de 502 en total); salió con código 1.
- `rollback-remote.sh <tag>` manual: OK, verificado por el smoke.
- No ensayado: restore de DB real (ver `docs/backups.md`) ni `--migrations` (no hay migraciones reversibles pendientes que probar).

## Backup de la base
Hay cron diario (`scripts/backup-db.sh`, 03:35 en el VPS) y el deploy hace un dump antes de cada release. Dump manual adicional (las credenciales quedan en el servidor):
```
ssh ubuntu@148.113.207.54 'mkdir -p ~/backups/numeros-rojos && cd ~/projects/numeros-rojos && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T mysql sh -c "mysqldump -u root -p\$MYSQL_ROOT_PASSWORD --single-transaction --routines \$MYSQL_DATABASE" | gzip > ~/backups/numeros-rojos/pre-<TAG>-$(date +%F-%H%M).sql.gz && gzip -t ~/backups/numeros-rojos/*.gz && ls -la ~/backups/numeros-rojos'
```
Base chica: ~1,5 MB, ~5.000 filas (casi todo `usd_quotes`). Restore: con `api` parada, `gunzip -c dump.sql.gz | docker compose … exec -T mysql sh -c 'mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'`. Parkium tiene `scripts/backup-db.sh`, `restore-db.sh`, `backup-age.sh` y cron en el VPS para copiar como modelo.

## Logs
No salen por `docker logs` (casi vacío). Dentro del contenedor: `docker exec numeros-rojos-api-1 tail -n 100 /var/log/php-fpm/error.log` (access log de php-fpm y errores de PHP), `/var/log/php-fpm/scheduler.log`, `/var/log/nginx/error.log` (este no persiste), `storage/logs/bcra-*.log`. Desde la tarea #82, `/var/log/php-fpm` y `storage/logs` son volúmenes (`php-logs`, `storage-logs`) y sobreviven al redeploy; supervisor rota a 10 MB x 3. nginx del host: `/var/log/nginx/` en el VPS.

## Procesos automatizados y cómo saber que funcionan
Tabla en `CLAUDE.md`. Monitoreo en la oficina: contenedores (≥4), scheduler vivo, días desde la última cotización (alerta > 12). Las sincronizaciones dejan latido en la tabla `scheduled_job_runs` (inicio/fin/estado/exit_code de cada `bcra:sync-*`, también manuales). Consulta: `docker exec numeros-rojos-mysql-1 sh -c 'mysql -uroot -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE -e "select command,status,started_at,finished_at from scheduled_job_runs order by id desc limit 10"'`. Métricas de la oficina: `php artisan bcra:heartbeat failed` (alerta > 0) y `stale-days` (alerta > 33; días desde el último éxito de deudas/cheques, 0 si aún no hay ejecuciones registradas). El detalle del error de una corrida fallida está en `storage/logs/bcra-*.log`. Ejecución manual: `docker exec numeros-rojos-api-1 php artisan bcra:sync-quotes` (escribe en la base: backup antes).
Próximas ejecuciones: 2026-11-01 03:00 y 03:10 (deudas, cheques); conviene mirar que corran.

## Qué requiere al CEO
Nada del flujo de deploy. Sí: credenciales que solo él tenga (BeSoccer, SMTP) si hay que rotarlas, y decidir rotar el `JWT_SECRET` (cierra la sesión del admin).
