# Operación en producción (runbook)

Sin secretos: están en `.env.prod` del VPS. Lo ejecuta el ingeniero de la compañía de forma autónoma desde la PC de la oficina (hay clave SSH sin passphrase al VPS, Docker local y `.env.local` con `SERVER=ubuntu@148.113.207.54`, `DEPLOY_PATH=/home/ubuntu/projects/numeros-rojos`). Nada de esto requiere al CEO.
Verificado en **solo lectura** el 2026-10-29. Los pasos de deploy, rollback y restore **no se ejecutaron**: describen lo que hace el `Makefile` más la mejora propuesta. Marcado **[sin ensayar]**.

## Estado actual
VPS único compartido. Contenedores `numeros-rojos-{api,frontend,mysql,redis}-1` (Up, restart `unless-stopped`), volúmenes `numeros-rojos_mysql-data` y `numeros-rojos_storage-data`. Puertos publicados en el host: api 8085, frontend 3005, mysql 3309, redis 16379. Versión: tag `1.38.0` (Laravel 13.38, PHP 8.4.27).

## Deploy (`make deploy TAG=x.y.z`) **[sin ensayar]**
1. Desde una copia limpia de `main` (no desde el checkout local, que puede tener trabajo sin commitear): `git fetch --tags; git tag --sort=-v:refname | head -1` → siguiente semver.
2. **Antes**: volcar la base (ver Backup). Hasta que exista `scripts/backup-db.sh` (backlog), es manual.
3. `make deploy TAG=x.y.z`. Qué hace realmente: si no estás en `main`, mergea tu rama en `main` y pushea; crea y pushea el tag; en el VPS `git checkout TAG`, **`make prod-down`**, build, up, `migrate --force`, `image prune`, `besoccer:warm-cache`. Consecuencias: **caída durante todo el build** (minutos), **sin tests previos, sin smoke test, sin rollback automático**. Mejora pedida en el backlog (patrón de Parkium: build antes de bajar, smoke test, revertir solo).
4. Verificar (abajo) y registrar en la tarea el tag y el resultado.

## Verificación
- `curl -s -o /dev/null -w '%{http_code}\n' https://numerosrojos.net/` → 200
- `curl -s https://numerosrojos.net/api/` → `{"name":"Números Rojos API",…,"status":"running"}`
- `curl -s -o /dev/null -w '%{http_code}\n' https://numerosrojos.net/api/api/v1/contracts/stats` → 200
- `ssh ubuntu@148.113.207.54 'cd ~/projects/numeros-rojos && git describe --tags --exact-match && docker compose -f docker-compose.prod.yml --env-file .env.prod ps'` → tag desplegado y 4 contenedores Up (mysql y redis healthy).
- **Scheduler:** `docker exec numeros-rojos-api-1 sh -c 'ps | grep [s]chedule:work'` (1 proceso) y `docker exec numeros-rojos-api-1 php artisan schedule:list` (3 comandos BCRA). Repetirlo tras cada deploy: el contenedor `api` se recrea.
- Datos al día: `select max(quote_date) from usd_quotes` (normalmente ≤ ~6 días de atraso).

## Rollback **[sin ensayar]**
- Solo código: en el VPS, `git fetch --tags && git checkout <TAG_ANTERIOR>` y `make prod-build && make prod-up` (hay caída durante el build). Tag previo: `git tag --sort=-v:refname | head -2`.
- Con migraciones: antes de volver el código, `docker compose -f docker-compose.prod.yml --env-file .env.prod exec api php artisan migrate:rollback --force` (revierte la última tanda) mientras el código nuevo sigue puesto; si es irreversible o destructiva → restore de la base.
- **Sin dump no hay vuelta atrás para los datos.**

## Backup de la base (hoy no existe ninguno)
Dump manual, solo lectura sobre producción (las credenciales quedan en el servidor):
```
ssh ubuntu@148.113.207.54 'mkdir -p ~/backups/numeros-rojos && cd ~/projects/numeros-rojos && docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T mysql sh -c "mysqldump -u root -p\$MYSQL_ROOT_PASSWORD --single-transaction --routines \$MYSQL_DATABASE" | gzip > ~/backups/numeros-rojos/pre-<TAG>-$(date +%F-%H%M).sql.gz && gzip -t ~/backups/numeros-rojos/*.gz && ls -la ~/backups/numeros-rojos'
```
Base chica: ~1,5 MB, ~5.000 filas (casi todo `usd_quotes`). Restore: con `api` parada, `gunzip -c dump.sql.gz | docker compose … exec -T mysql sh -c 'mysql -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE'`. Parkium tiene `scripts/backup-db.sh`, `restore-db.sh`, `backup-age.sh` y cron en el VPS para copiar como modelo.

## Logs
No salen por `docker logs` (casi vacío). Dentro del contenedor: `docker exec numeros-rojos-api-1 tail -n 100 /var/log/php-fpm/error.log` (access log de php-fpm y errores de PHP), `/var/log/php-fpm/scheduler.log`, `/var/log/nginx/error.log`, `storage/logs/bcra-*.log` (se pierden al redeploy). nginx del host: `/var/log/nginx/` en el VPS.

## Procesos automatizados y cómo saber que funcionan
Tabla en `CLAUDE.md`. Monitoreo en la oficina: contenedores (≥4), scheduler vivo, días desde la última cotización (alerta > 12). **No hay señal para las sincronizaciones mensuales** (deudas, cheques): `updated_at` solo cambia si hay datos nuevos y el log se pierde (backlog). Ejecución manual: `docker exec numeros-rojos-api-1 php artisan bcra:sync-quotes` (escribe en la base: backup antes).
Próximas ejecuciones: 2026-11-01 03:00 y 03:10 (deudas, cheques); conviene mirar que corran.

## Qué requiere al CEO
Nada del flujo de deploy. Sí: credenciales que solo él tenga (BeSoccer, SMTP) si hay que rotarlas, y decidir rotar el `JWT_SECRET` (cierra la sesión del admin).
