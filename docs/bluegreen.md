# Deploy blue/green sin caída (tarea #142)

**Estado: ADOPTADO en producción el 2026-10-30 (tarea #143).** `make deploy` usa `scripts/deploy-bluegreen.sh`; el rollback de código es `scripts/switch-color.sh`. Resultados de producción en [Adopción en producción](#adopción-en-producción-tarea-143).
Resultado del ensayo: **0 respuestas no-200** en 8 escenarios (adopción, deploy exitoso, rollback, build roto, smoke fallido, falla post-conmutación, migración destructiva, deploy exitoso posterior). Detalle en [Medición](#medición).

## Diseño

```
              nginx del HOST (numerosrojos.net, TLS)           include /etc/nginx/conf.d/nr-active-color.conf
  usuarios ─▶  /api → proxy_pass http://nr_api                  upstream nr_api   { server 127.0.0.1:<api del color activo>; }
               /    → proxy_pass http://nr_front                upstream nr_front { server 127.0.0.1:<front del color activo>; }
                          │
        ┌─────────────────┴──────────────────┐
   proyecto nr-blue (8085/3005)         proyecto nr-green (8185/3105)      ← api+frontend, uno activo y otro idle/rollback
        └─────────────────┬──────────────────┘
                red numeros-rojos-network (compartida)
   proyecto numeros-rojos ("datos"): mysql + redis + volúmenes (nunca se recrean en un deploy)
```

Archivos: `docker-compose.data.yml` (mysql+redis), `docker-compose.bluegreen.yml` (un color: api+frontend), `scripts/lib-bluegreen.sh`, `scripts/deploy-bluegreen.sh`, `scripts/switch-color.sh`, `scripts/check-migrations-compat.sh`, `scripts/bluegreen-probe.sh`, `scripts/bluegreen-rehearsal.sh` (el ensayo), `docker/php/scheduler-run.sh`.

1. **Dos proyectos compose.** `datos` es **el mismo proyecto `numeros-rojos` de hoy** con mysql/redis idénticos a `docker-compose.prod.yml`: adoptarlo no recrea los contenedores (verificado en el ensayo: mismo id de contenedor), conservan nombre (`numeros-rojos-mysql-1`: backups, cron y monitoreo siguen andando), volúmenes y puerto 3309. Los colores son `nr-blue` (8085/3005, los puertos actuales) y `nr-green` (8185/3105); publican en `127.0.0.1` (hoy 8085/3005 están abiertos a internet, esto lo cierra). Cada color tiene su red privada (el `api:` del frontend resuelve a su propio api) y se conecta a la red compartida solo para llegar a mysql/redis.
2. **El color activo es un include de nginx del host.** `scripts/switch-color.sh <color>` genera `nr-active-color.conf` (los dos `upstream`), corre `nginx -t`, recarga (`nginx -s reload`, graceful: los workers viejos terminan sus requests en curso) y verifica por la ruta pública. Si `nginx -t` falla restaura el include anterior y no recarga. `/color.txt` y `/api/color.txt` (archivos montados desde `.bluegreen/`) dicen qué color sirve: así el script y el sondeo ven qué contestó.
3. **Deploy** (`PREV_REF=<ref> scripts/deploy-bluegreen.sh <TAG>`, lo invoca `make deploy` cuando se adopte): guardas (mysql healthy; estado ≠ stack único) → `check-migrations-compat.sh` → backup (`scripts/backup-db.sh`, sin cambios) → build del color **inactivo** (el activo sirve) → `up -d --force-recreate` del inactivo → `migrate --force` → **smoke directo al color nuevo por su puerto** (home, `/` running, `contracts/stats` con DB, `color.txt`, `schedule:list`) → `switch-color.sh` → verificación pública (si falla, **revierte solo** al color anterior). Cualquier falla antes de conmutar deja el tráfico donde estaba: 0 cortes, y el repo vuelve a `PREV_REF`. El color anterior queda arriba (`--stop-old` lo baja).
4. **Rollback = reconmutar**: `scripts/switch-color.sh <color-anterior>` (~segundos, el stack viejo sigue arriba hasta el próximo deploy, que reutiliza ese color). Cubre código; las migraciones no se revierten (ver 5).
5. **Un solo scheduler.** `schedule:work` no usa `onOneServer`/`withoutOverlapping`: dos corriendo duplicarían los `bcra:sync-*`. El programa de supervisor ahora es `docker/php/scheduler-run.sh`: sin `BG_ACTIVE_FILE` (dev, stack único) arranca directo (comportamiento idéntico al actual); con blue/green corre solo mientras `.bluegreen/active` (montado read-only) valga su `COLOR`, revisando cada 2 s, y sobrevive a reinicios de contenedor. `switch-color.sh` hace el traspaso en orden: `active=none` → espera a que el saliente no tenga `schedule:work` → `active=<nuevo>` → espera a que el entrante tenga exactamente 1. Hueco sin scheduler: ~3-6 s. **No desplegar a menos de 2 min de: día 1 03:00/03:10, lunes 04:00** (un tick en el hueco se perdería; el latido `scheduled_job_runs` lo delataría).
6. **Volúmenes.** `storage-data` (storage/app: subidas) y `storage-logs` (storage/logs: `bcra-*.log`) son los volúmenes actuales, externos y **compartidos** por ambos colores (verificado: archivo escrito por un color, leído por el otro; Laravel loguea en archivos diarios con append). `php-logs` (`/var/log/php-fpm`) pasa a **uno por color** (`nr-<color>_php-logs`): supervisor rota esos archivos y dos rotando el mismo se pisan; consecuencia: `scheduler.log` queda en el volumen del color que corrió el scheduler.
7. **Migraciones: expand/contract** (abajo).

## Migraciones: regla expand/contract

Durante la ventana de un deploy **ambas versiones corren contra la misma base** (la nueva ya migró; la vieja sigue sirviendo hasta conmutar, y después queda de rollback). Por eso toda migración debe ser **compatible hacia atrás**:
- **Permitido en una release (expand):** crear tablas, agregar columnas `nullable()` o con `default`, agregar índices, agregar valores a un enum solo si la versión vieja los ignora.
- **Prohibido en la misma release que deja de usarlos (contract):** `dropColumn`, `dropIfExists`/`drop`, `renameColumn`/`rename`, `->change()`, `dropIndex/Foreign/Unique`, `truncate`, SQL `DROP/RENAME/MODIFY`. Se hacen en **dos releases**: N deja de usar la columna/tabla (el código viejo ya no la necesita), N+1 la borra.
- **Columna NOT NULL sin default** agregada a tabla existente: el `INSERT` de la versión vieja falla. Agregarla `nullable` y endurecer después.
- **Redis/caché compartidos:** no cambiar el formato de un valor cacheado bajo la misma clave sin versionar la clave (los dos colores leen y escriben el mismo Redis). El `JWT_SECRET` es el mismo (sesiones del admin siguen valiendo).

**Cómo se detecta:** `scripts/check-migrations-compat.sh <ref-anterior> [HEAD]` mira `up()` de las migraciones nuevas/modificadas y marca `BREAKING` (patrones de arriba, sale con 2) o `AVISO` (NOT NULL sin default). `deploy-bluegreen.sh` lo corre antes del backup y **aborta** ante `BREAKING` salvo `ALLOW_BREAKING_MIGRATION=1` (acepta que la versión vieja pueda fallar mientras conviva: el deploy deja de ser sin corte y no hay rollback instantáneo seguro). Es una heurística de texto: no reemplaza leer la migración. Caso real: corrido sobre el historial reciente marca `2026_10_30_000002_drop_own_analytics_tables` (#120) como BREAKING — correcto: esa es una migración *contract* (la release anterior ya no usaba las tablas, así que era segura; con este chequeo se aprobaría con `ALLOW_BREAKING_MIGRATION=1` tras confirmarlo). Un `down()` reversible sigue siendo requisito; el rollback de datos sigue siendo `docs/operacion.md` > Rollback B/C.

## Adopción en producción (tarea #143)

Ejecutada el 2026-10-30 desde la PC de la oficina por SSH, siguiendo el plan de abajo, con sondeo externo (`bluegreen-probe.sh https://numerosrojos.net`, cada 0,5 s, home + `contracts/stats` + `color.txt`).

| Paso | Resultado |
|---|---|
| 0. Deploy de `main` con el flujo anterior (1.42.0) + backup manual (`gzip -t` OK) | OK |
| 1. `init_state`; `up -d --dry-run` de `docker-compose.data.yml`: sin recrear mysql/redis | OK; mysql `fe890127bcd1…` idéntico antes y después |
| 2. nginx: backup `~/numerosrojos.net.bak-pre-bluegreen`, include `conf.d/nr-active-color.conf` (blue = 8085/3005), solo se cambiaron los 2 `proxy_pass` del vhost, `nginx -t` + `reload` | OK; home, `/api/`, `contracts/stats` = 200 |
| 3. Scheduler viejo detenido, `FIRST_COLOR=1 deploy-bluegreen.sh` (green 8185/3105): backup → build → migrate → smoke directo → conmutación → verificación pública | OK; scheduler en green (1 proceso) |
| 4. `rm -sf api frontend` del stack único (datos intactos) | OK; 8085/3005 libres, mysql mismo id |
| 5. Flujo: `make deploy` → `deploy-bluegreen.sh`; `rollback-remote.sh` en modo blue/green; guardas en los scripts viejos; monitoreo de la oficina actualizado | ver abajo |
| 6. Primer deploy real con el flujo nuevo (1.42.2, green → blue) | OK, **0 no-200** |
| Rollback ensayado en producción (`switch-color.sh green`, 20 s después `switch-color.sh blue`) | OK, **0 no-200**; el scheduler siguió al color activo en cada traspaso (3-7 s) |

Sondeo: migración (pasos 3-4) 998 muestras, **0 errores** (13 respuestas 404 de `/api/color.txt` mientras servía el stack único, que todavía no tenía esa marca: esperado y tolerado); deploy 1.42.2 + rollback + vuelta, 701 muestras, **0 no-200**.

Incidentes del camino (sin impacto en usuarios):
- `make deploy TAG=1.42.1` se lanzó con el Makefile viejo ya cargado por make (el `git pull` del propio target trajo el nuevo) y ejecutó `deploy-remote.sh` en el VPS: **la guarda `refuse_if_bluegreen` lo frenó antes de tocar nada** (el tag 1.42.1 quedó creado y es equivalente a 1.42.0 + docs). Lección: tras mergear un cambio del Makefile, el primer `make deploy` desde un checkout desactualizado usa la receta vieja; la guarda lo cubre.
- Alertas ContainerDown (Prometheus) quedaron "pending" ~5 min por los contenedores `numeros-rojos-{api,frontend}-1` retirados del stack único (la regla es genérica, por `container_last_seen`, no por nombre: no hizo falta tocarla). **Al bajar un color a propósito (`--stop-old`) puede saltar esa alerta**; los dos colores corren siempre.
- `sed -i` sobre `/etc/nginx/sites-enabled/numerosrojos.net`: es un archivo regular (en `sites-available/` hay una copia vieja idéntica al backup); el vhost activo es el de `sites-enabled`. Otros vhosts no se tocaron.

Monitoreo de la oficina (`config/proyectos/numeros-rojos.toml`): contenedores = `docker ps` con `numeros-rojos-`, `nr-blue-`, `nr-green-` (en régimen 6, alerta < 4); scheduler = suma de `schedule:work` en `nr-blue-api-1` + `nr-green-api-1` (debe ser 1, alerta < 1); `bcra:heartbeat` se ejecuta en `nr-<color activo>-api-1` leyendo `.bluegreen/active`.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| **Docker Swarm / rolling update** (`update_config: order: start-first`) | Exige `swarm init` en el VPS compartido (cambia infraestructura de otros proyectos), red overlay y ingress mesh, y servicios en vez de compose. No resuelve migraciones ni scheduler único, y no da rollback instantáneo con el stack viejo caliente. |
| **Traefik / Caddy** delante | Necesitarían los puertos 80/443, que ya tiene el nginx del host con TLS (certbot) de varios proyectos: o se migra toda esa infraestructura compartida o queda un salto extra detrás de nginx. No aporta nada que `nginx -s reload` no dé ya. |
| **nginx dentro del compose** | Igual: el nginx del host sigue terminando TLS, así que es un proxy más, con su propio ciclo de vida; el reload del host ya es graceful. |
| **Escalar el servicio a 2 réplicas y quitar la vieja** (estilo `docker-rollout`) | Los puertos publicados fijos (8085/3005) impiden dos réplicas; haría falta un proxy con descubrimiento DNS (cae en alguna de las anteriores). |
| **Elegida: 2 colores + include de nginx del host** | Usa lo que ya está (nginx del host, compose), cero software nuevo, conmutación atómica y reversible en segundos, y es replicable a otros proyectos que ya tengan nginx del host (Parkium). |

## Medición

Ensayo `scripts/bluegreen-rehearsal.sh` (2026-10-30, PC de la oficina, Docker 29 / Compose 5.5): clona el repo, levanta el **stack único real** (`docker-compose.prod.yml`), un nginx 1.26.3 (la versión del VPS) en red host imitando `/etc/nginx/sites-enabled/numerosrojos.net` (mismo `rewrite ^/api` y `proxy_pass`, sin TLS) y corre las fases con `scripts/bluegreen-probe.sh` sondeando cada 0,2 s **tres URLs en paralelo**: `/`, `/api/api/v1/contracts/stats` (toca la DB) y `/api/color.txt` (qué color sirve). Error = no-200 en las dos primeras, o 000/5xx en la tercera (404 tolerado: el stack único previo no tiene `color.txt`). Base de datos con datos vacíos migrados; el build usó caché de capas (en el VPS un build real tarda minutos; con el color activo sirviendo no afecta).

| Fase | Resultado | Muestras | No-200 |
|---|---|---|---|
| A. Adopción: stack único → blue/green (mysql no recreado, include + sitio con `upstream`, primer color green, retiro del api/frontend viejos) | OK | 189 | **0** |
| B. Deploy exitoso (v2: migración aditiva + código nuevo) → blue; green sigue arriba; storage compartido | OK | 169 | **0** |
| C. Rollback (`switch-color.sh green`); scheduler pasó solo a green | OK | 110 | **0** |
| D. Build roto (composer.json inválido) → falla en build, no se conmuta, repo vuelve a `PREV_REF` | OK (exit≠0) | 80 | **0** |
| E. Smoke fallido (la API tira excepción) → no se conmuta, scheduler intacto | OK (exit≠0) | 341 | **0** |
| F. Falla la verificación pública tras conmutar → **reversión automática** a green | OK (exit≠0) | 662 | **0** |
| G. Migración destructiva (`dropColumn`) → rechazada antes de construir | OK (exit≠0) | 56 | **0** |
| H. Deploy exitoso después de las fallas | OK | 213 | **0** |

Además verificado en cada fase: exactamente un `schedule:work` (en el color activo); el contenedor mysql nunca cambió de id en todo el ensayo. 0 fallidas de 48 verificaciones. Reproducir: `scripts/bluegreen-rehearsal.sh` (~4 min con caché, más con frío; usa puertos 8085 3005 8185 3105 3309 16379 18090; limpia todo lo suyo, prefijo `nrbg`; resultados en `/tmp/nrbg-rehearsal/results.md`).

**Lo que el ensayo no cubre (riesgos):**
- Tráfico real concurrente: el sondeo es de ~15 req/s en total, no carga de usuarios. Un request en vuelo al conmutar lo termina el worker viejo de nginx contra el color viejo, que sigue arriba.
- **Chunks del frontend:** un usuario con la SPA abierta de la versión vieja, que pida un chunk con hash que ya no existe en el color nuevo, recibe el `index.html` (fallback SPA) y puede fallar al navegar hasta recargar. Ya pasa hoy con cada deploy; el blue/green no lo agrava ni lo arregla.
- TLS y los permisos reales del VPS (el ensayo corre sin sudo): ver paso 0 de la migración (se verifican antes de tocar nada).
- Compose del VPS es 2.39.1 (el ensayo 5.5.1): por eso el paso de adopción de datos usa `--dry-run` y aborta si dice que recrea mysql.
- Ensayo con base vacía: el tiempo de `migrate` y de backup (~1,5 MB) en producción es el mismo que hoy.
- Memoria: el color idle suma ~100 MB (api ~99 MB + frontend ~6 MB); el VPS tiene ~5,8 GB disponibles.

## Plan de migración de producción (ejecutado en la tarea #143)

Lo ejecuta el ingeniero desde la PC de la oficina por SSH; no requiere al CEO. **Ventana:** fuera de 03:00–03:15 del día 1 y lunes 04:00. Toda la migración es **sin corte**; los pasos 1–3 no cambian lo que sirve.

**0. Preparación (solo lectura / sin efecto).** Mergear este trabajo a `main` y desplegarlo con el flujo actual (`make deploy TAG=…`): trae scripts y compose nuevos y la imagen del api con `scheduler-run.sh` (sin `BG_ACTIVE_FILE` se comporta igual que hoy; `scripts/lib-deploy.sh` no cambia nada hasta que exista `.bluegreen/active`). Verificar en el VPS: `sudo -n true` (hecho: OK), puertos 8185/3105 libres (hecho: libres), `docker compose version` ≥ 2.20 (hecho: 2.39.1), espacio en disco (hecho: 48 GB libres). Backup manual: `scripts/backup-db.sh` y anotar el dump.
**1. Adoptar datos sin recrearlos.** `cd ~/projects/numeros-rojos && . scripts/lib-bluegreen.sh && init_state` (crea `.bluegreen/` con `active=legacy`). `docker compose -p numeros-rojos -f docker-compose.data.yml --env-file .env.prod up -d --dry-run 2>&1 | grep -i -E "recreate|create"`: **si dice que recrea mysql o redis, abortar** (no seguir; investigar la diferencia con `docker compose … config`). Si no, correr el `up -d` real (no hace nada: "Running").
**2. nginx del host, include con los puertos actuales.** `sudo cp /etc/nginx/sites-enabled/numerosrojos.net ~/numerosrojos.net.bak-pre-bluegreen`. Crear el include con el stack único como "blue" (8085/3005): `. scripts/lib-bluegreen.sh; render_conf blue | sudo tee /etc/nginx/conf.d/nr-active-color.conf`. En el sitio reemplazar `proxy_pass http://localhost:8085;` por `proxy_pass http://nr_api;` y `proxy_pass http://localhost:3005;` por `proxy_pass http://nr_front;` (el `rewrite ^/api(.*)$ $1 break;` queda igual). `sudo nginx -t && sudo nginx -s reload`. Verificar `/`, `/api/` y `contracts/stats` = 200: el tráfico sigue yendo al mismo lugar. **Vuelta atrás de 2:** restaurar el `.bak`, borrar el include, `sudo nginx -t && sudo nginx -s reload`.
**3. Primer color (green), con el stack único todavía sirviendo.** Ceder el scheduler del stack único: `docker exec numeros-rojos-api-1 supervisorctl stop laravel-scheduler` (desde acá hasta el final del paso, no hay scheduler: unos minutos). `PREV_REF=$(git rev-parse HEAD) FIRST_COLOR=1 scripts/deploy-bluegreen.sh <TAG>`: backup → build de green → migrate → smoke directo en 8185/3105 → conmuta y verifica; el scheduler arranca en green. **Si falla algo** antes de conmutar, el tráfico no se movió: reiniciar el scheduler viejo (`docker exec numeros-rojos-api-1 supervisorctl start laravel-scheduler`) y diagnosticar. **Si falla después de conmutar,** `switch-color.sh` ya revirtió al stack único (include en 8085/3005): hacer lo mismo con el scheduler.
**4. Retirar el stack único (api/frontend), conservar datos.** Solo si el paso 3 verificó: `docker compose -f docker-compose.prod.yml --env-file .env.prod rm -sf api frontend` (mysql y redis no se tocan). Libera 8085/3005 para el color blue. Verificar: sitio 200, `docker exec nr-green-api-1 sh -c 'ps | grep [s]chedule:work'` (1 proceso), mysql con el mismo `docker inspect -f '{{.Id}}'` que antes (anotarlo en el paso 1), `schedule:list`.
**5. Cambiar el flujo de deploy y lo que depende de los nombres.** `make deploy` pasa a invocar `scripts/deploy-bluegreen.sh` (en vez de `deploy-remote.sh`); `scripts/rollback-remote.sh` queda reemplazado por `switch-color.sh` (los scripts viejos ya se niegan a correr si `active` es blue/green). Actualizar el monitoreo de la oficina (`config/proyectos/numeros-rojos.toml`): los contenedores pasan de `numeros-rojos-{api,frontend}-1` a `nr-<color>-{api,frontend}-1` (el color activo puede ser cualquiera de los dos; el chequeo "≥4 contenedores" pasa a ≥4 con colores idle arriba, y el "scheduler vivo" debe mirar `nr-blue-api-1` **o** `nr-green-api-1`). Actualizar `docs/operacion.md`, `CLAUDE.md` (nombres de contenedores, logs: `docker exec nr-<activo>-api-1 …`) y el comando de las métricas `bcra:heartbeat`/`data:freshness`.
**6. Primer deploy real con el flujo nuevo** (tag siguiente, idealmente con un cambio trivial): sondear desde la oficina con `scripts/bluegreen-probe.sh https://numerosrojos.net /tmp/probe.log 0.5` durante todo el deploy y registrar el resultado (cero no-200 esperado).

## Vuelta atrás total

**Plan de vuelta atrás total (volver al stack único)**, posible en cualquier momento sin pérdida de datos (también ya retirado el stack único): `docker compose -f docker-compose.prod.yml --env-file .env.prod up -d api frontend` (si ya se retiraron; levantan en 8085/3005 con los volúmenes de siempre), `docker exec numeros-rojos-api-1 supervisorctl start laravel-scheduler` si hace falta, restaurar el sitio de nginx desde el `.bak` (vuelve a `localhost:8085/3005`), `sudo rm /etc/nginx/conf.d/nr-active-color.conf`, `sudo nginx -t && sudo nginx -s reload`, `docker compose -p nr-green -f docker-compose.bluegreen.yml down` (y `nr-blue`), borrar `.bluegreen/`. Antes de bajar green, verificar que el stack único sirve. Los datos no se tocaron en ningún paso (mysql nunca se recrea), así que no hay restore de DB asociado a esta migración; las migraciones de cada release siguen el procedimiento de `docs/operacion.md` (Rollback B/C).

## Operación diaria (después de adoptar)

- Deploy: `make deploy TAG=x.y.z` (corre `make test-ci`, push, tag y `scripts/deploy-bluegreen.sh` en el VPS). Verificación: `cat ~/projects/numeros-rojos/.bluegreen/active` (color activo), `curl -s https://numerosrojos.net/api/color.txt`.
- Rollback de código: `scripts/switch-color.sh <color-anterior>` (el anterior debe seguir arriba; si no, se levanta con `docker compose -p nr-<color> -f docker-compose.bluegreen.yml --env-file .env.prod up -d` con las variables de `dc`, o más simple: re-desplegar el tag anterior).
- Deploy a mano de un color sin conmutar: `. scripts/lib-bluegreen.sh; dc green up -d --build`.
- Si `switch-color.sh` reporta "AVISO: revisar el scheduler": `docker exec nr-<color>-api-1 sh -c 'ps | grep [s]chedule:work'` y el contenido de `.bluegreen/active` (debe ser el color activo; `none` es un traspaso a medias: escribir el color a mano).
- Los dos colores corren siempre (≈100 MB extra); `--stop-old` en el deploy baja el viejo si hiciera falta memoria.
