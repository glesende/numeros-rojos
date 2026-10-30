#!/usr/bin/env bash
# Ensayo aislado del deploy blue/green (tarea #142). NO toca producción: clona el repo a $WORK, levanta un stack
# propio (proyectos `nrbg*`, volúmenes `nrbg_*`) y un nginx en el host (contenedor `nrbg-nginx`, red host, :18090)
# que imita al del VPS (proxy_pass a 127.0.0.1:<puerto>, mismo `rewrite ^/api` y `include` del color activo).
# Mide con un sondeo cada 0,2 s (scripts/bluegreen-probe.sh) que haya CERO respuestas no-200 en: adopción del stack
# actual, deploy exitoso, rollback, build roto, smoke fallido, falla post-conmutación y migración destructiva.
#   scripts/bluegreen-rehearsal.sh        (requiere Docker y los puertos 8085 3005 8185 3105 3309 16379 18090 libres)
# Resultados en $WORK/results.md. KEEP=1 deja el stack arriba al final.
set -uo pipefail
SRC="$(git rev-parse --show-toplevel)"
WORK="${WORK:-/tmp/nrbg-rehearsal}"
R="$WORK/numeros-rojos"          # el clon; el nombre de carpeta imita al del VPS
PORT=18090
FAILS=0

cleanup() {
  [ -n "${PROBE_PID:-}" ] && kill "$PROBE_PID" 2>/dev/null
  docker rm -f nrbg-nginx >/dev/null 2>&1
  docker ps -aq --filter name='^nrbg' | xargs -r docker rm -f >/dev/null 2>&1
  docker volume ls -q --filter name='^nrbg' | xargs -r docker volume rm >/dev/null 2>&1
  docker network rm numeros-rojos-network >/dev/null 2>&1
  return 0
}
say() { echo "$*" | tee -a "$WORK/results.md"; }
check() { # descripción, comando...
  local d="$1"; shift
  if "$@" >/dev/null 2>&1; then say "- [OK] $d"; else say "- [FALLA] $d"; FAILS=$((FAILS + 1)); fi
}

cleanup
rm -rf "$WORK"; mkdir -p "$WORK/nginx/conf.d" "$WORK/backups" "$WORK/tf"
: > "$WORK/results.md"
git clone -q "$SRC" "$R" && cd "$R" || exit 1
git config user.email t@t; git config user.name t
BASE_REF="$(git rev-parse HEAD)"

printf ".env.prod\n.bluegreen/\n" >> .git/info/exclude
cat > .env.prod <<EOT
DB_DATABASE=numeros_rojos
DB_USERNAME=app
DB_PASSWORD=rehearsal-pass
DB_ROOT_PASSWORD=rehearsal-root
JWT_SECRET=rehearsal-jwt-secret-0123456789abcdef0123456789
VITE_API_URL=/api/v1
VITE_GA_MEASUREMENT_ID=
ADMIN_EMAIL=
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=
EOT

# ---- entorno del ensayo (los defaults del VPS, salvo lo que aísla) ----
export COMPOSE_PROJECT_NAME=nrbg BG_PREFIX=nrbg DATA_PROJECT=nrbg NR_VOL_PREFIX=nrbg
export NGINX_SUDO="" NGINX_TEST_CMD="docker exec nrbg-nginx nginx -t" NGINX_RELOAD_CMD="docker exec nrbg-nginx nginx -s reload"
export NGINX_ACTIVE_CONF="$WORK/nginx/conf.d/nr-active-color.conf"
export SMOKE_BASE="http://127.0.0.1:$PORT" SMOKE_TIMEOUT=60
export BACKUP_DIR="$WORK/backups" TEXTFILE_DIR="$WORK/tf"
. scripts/lib-bluegreen.sh

# ---- variantes de código (commits sobre la base) ----
mkv() { # nombre, base-tag, comando-que-modifica
  git checkout -q "$2" && eval "$3" && git add -A && git commit -qm "variante $1" && git tag "$1"
}
git tag v1
mkv v2 v1 'echo v2 > backend/public/version.txt; cat > backend/database/migrations/2026_11_02_000001_bg_rehearsal_additive.php <<EOP
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::create("bg_rehearsal", function (Blueprint \$t) { \$t->id(); \$t->string("note")->nullable(); }); }
    public function down(): void { Schema::dropIfExists("bg_rehearsal"); }
};
EOP'
mkv v3-buildroto v2 'echo "{ roto" > backend/composer.json'
mkv v4-smoke v2 'cat > backend/routes/web.php <<EOP
<?php
use Illuminate\Support\Facades\Route;
Route::get("/", function () { throw new RuntimeException("rehearsal"); });
EOP'
mkv v5-postswitch v2 'echo v5 > backend/public/version.txt'
mkv v6 v2 'echo v6 > backend/public/version.txt'
mkv v7-destructiva v6 'cat > backend/database/migrations/2026_11_03_000001_bg_rehearsal_drop.php <<EOP
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::table("bg_rehearsal", function (Blueprint \$t) { \$t->dropColumn("note"); }); }
    public function down(): void { Schema::table("bg_rehearsal", function (Blueprint \$t) { \$t->string("note")->nullable(); }); }
};
EOP'
git checkout -q v1

# ---- nginx "del host" ----
cat > "$WORK/nginx/conf.d/site.conf" <<'EOT'
server {
    listen 18090;
    server_name _;
    client_max_body_size 20M;
    location /api {
        rewrite ^/api(.*)$ $1 break;
        proxy_pass http://localhost:8085;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120;
        proxy_send_timeout 120;
    }
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOT
docker run -d --name nrbg-nginx --network host -v "$WORK/nginx/conf.d:/etc/nginx/conf.d:ro" nginx:1.26-alpine >/dev/null || exit 1

# ---- helpers de fase ----
start_probe() { bash scripts/bluegreen-probe.sh "$SMOKE_BASE" "$WORK/probe-$1.log" 0.2 > "$WORK/probe-$1.summary" 2>&1 & PROBE_PID=$!; sleep 2; }
stop_probe() { # fase -> 0 si cero errores
  sleep 2; kill -TERM "$PROBE_PID"; wait "$PROBE_PID"; local rc=$?; PROBE_PID=""
  say '```'; say "[sondeo $1]"; cat "$WORK/probe-$1.summary" | tee -a "$WORK/results.md"; say '```'
  return $rc
}
deploy() { # tag [env...]  (imita make deploy: checkout del tag + PREV_REF)
  local tag="$1"; shift
  local prev; prev="$(git rev-parse HEAD)"
  git checkout -q "$tag" && env PREV_REF="$prev" "$@" scripts/deploy-bluegreen.sh "$tag" >> "$WORK/deploy-$tag.log" 2>&1
}
sched() { echo "blue=$(scheduler_count blue) green=$(scheduler_count green)"; }
sched_owner_is() { [ "$(scheduler_count "$1")" = 1 ] && [ "$(scheduler_count "$(other_color "$1")")" != 1 ]; }
MYSQL_ID=""
mysql_same() { [ "$(docker inspect -f '{{.Id}}' nrbg-mysql-1)" = "$MYSQL_ID" ]; }
served_is() { [ "$(curl -s "$SMOKE_BASE/api/color.txt")" = "$1" ]; }
ver_is() { [ "$(curl -s "$SMOKE_BASE/api/version.txt")" = "$1" ]; }

say "# Ensayo blue/green $(date -u +%F\ %H:%M) UTC — nginx $(docker exec nrbg-nginx nginx -v 2>&1 | sed 's/.*: //')"

# ===== 0. Stack único actual (docker-compose.prod.yml tal cual) =====
say "## 0. Stack único (estado actual de producción)"
docker compose -p nrbg -f docker-compose.prod.yml --env-file .env.prod up -d --build >> "$WORK/legacy.log" 2>&1 || { say "no pudo levantar el stack único"; exit 1; }
until [ "$(docker inspect -f '{{.State.Health.Status}}' nrbg-mysql-1)" = healthy ]; do sleep 2; done
docker compose -p nrbg -f docker-compose.prod.yml --env-file .env.prod exec -T api php artisan migrate --force >> "$WORK/legacy.log" 2>&1
wait_code "$SMOKE_BASE/api/api/v1/contracts/stats" 200 >/dev/null || { say "el stack único no responde"; exit 1; }
MYSQL_ID="$(docker inspect -f '{{.Id}}' nrbg-mysql-1)"; REDIS_ID="$(docker inspect -f '{{.Id}}' nrbg-redis-1)"
check "stack único sirve (nginx -> 8085/3005)" test "$(http_code "$SMOKE_BASE/")" = 200

# ===== A. Adopción sin corte =====
say "## A. Adopción: stack único -> blue/green (sin corte)"
start_probe A
init_state
dcdata up -d >> "$WORK/adopt.log" 2>&1
check "adoptar mysql/redis con docker-compose.data.yml NO los recrea (mismo id de contenedor)" test "$(docker inspect -f '{{.Id}}' nrbg-mysql-1)" = "$MYSQL_ID" -a "$(docker inspect -f '{{.Id}}' nrbg-redis-1)" = "$REDIS_ID"
render_conf blue > "$NGINX_ACTIVE_CONF"            # el include apunta primero a los puertos del stack único (8085/3005)
$NGINX_TEST_CMD >/dev/null 2>&1 && $NGINX_RELOAD_CMD >/dev/null 2>&1
sed -i 's#proxy_pass http://localhost:8085;#proxy_pass http://nr_api;#; s#proxy_pass http://localhost:3005;#proxy_pass http://nr_front;#' "$WORK/nginx/conf.d/site.conf"
check "nginx -t con el sitio usando upstream nr_api/nr_front" $NGINX_TEST_CMD
$NGINX_RELOAD_CMD >/dev/null 2>&1
docker exec nrbg-api-1 supervisorctl stop laravel-scheduler >/dev/null 2>&1   # el scheduler del stack único cede antes de la conmutación
deploy v1 FIRST_COLOR=1; rc=$?
check "primer deploy (FIRST_COLOR=1) a green terminó OK" test "$rc" = 0
check "tráfico servido por green" served_is green
check "scheduler: solo en green ($(sched))" sched_owner_is green
docker compose -p nrbg -f docker-compose.prod.yml --env-file .env.prod rm -sf api frontend >> "$WORK/adopt.log" 2>&1
check "stack único (api/frontend) retirado y el sitio sigue sirviendo" served_is green
check "mysql sigue siendo el mismo contenedor" mysql_same
stop_probe A; check "A: cero respuestas no-200" test $? = 0

# ===== B. Deploy exitoso con migración aditiva =====
say "## B. Deploy exitoso (v2: migración aditiva + código nuevo)"
start_probe B
deploy v2; rc=$?
check "deploy v2 OK" test "$rc" = 0
check "tráfico en blue con v2" ver_is v2
served_is blue && say "- [OK] color servido: blue" || { say "- [FALLA] color servido != blue"; FAILS=$((FAILS+1)); }
check "migración aplicada (tabla bg_rehearsal)" bash -c "docker exec nrbg-mysql-1 sh -c 'mysql -uroot -p\$MYSQL_ROOT_PASSWORD \$MYSQL_DATABASE -e \"select 1 from bg_rehearsal limit 1\"'"
check "scheduler: solo en blue ($(sched))" sched_owner_is blue
check "green (versión anterior) sigue arriba y sano" test "$(http_code "http://127.0.0.1:$GREEN_API_PORT/")" = 200
docker exec nrbg-green-api-1 sh -c 'echo compartido > /var/www/html/storage/app/probe.txt' 2>/dev/null || dc green exec -T api sh -c 'echo compartido > /var/www/html/storage/app/probe.txt'
check "storage/app compartido entre colores" bash -c "[ \"\$(cd '$R' && . scripts/lib-bluegreen.sh && dc blue exec -T api cat /var/www/html/storage/app/probe.txt | tr -d '[:space:]')\" = compartido ]"
stop_probe B; check "B: cero respuestas no-200" test $? = 0

# ===== C. Rollback instantáneo =====
say "## C. Rollback (switch-color.sh al color anterior)"
start_probe C
git checkout -q v2
scripts/switch-color.sh green >> "$WORK/rollback.log" 2>&1; rc=$?
check "rollback a green OK" test "$rc" = 0
check "tráfico de nuevo en green con v1 (sin version.txt)" bash -c "[ \"\$(curl -s -o /dev/null -w '%{http_code}' $SMOKE_BASE/api/version.txt)\" != 200 ] || ! curl -s $SMOKE_BASE/api/version.txt | grep -q v2"
served_is green && say "- [OK] color servido: green" || { say "- [FALLA] color servido != green"; FAILS=$((FAILS+1)); }
check "scheduler: solo en green ($(sched))" sched_owner_is green
stop_probe C; check "C: cero respuestas no-200" test $? = 0

# ===== D. Build roto =====
say "## D. Deploy con build roto (v3)"
start_probe D
deploy v3-buildroto; rc=$?
check "deploy v3 falló (código != 0)" test "$rc" != 0
check "el log dice que el build falló y no se conmuta" grep -q "Build falló" "$WORK/deploy-v3-buildroto.log"
check "activo sigue siendo green" test "$(active_color)" = green
check "scheduler intacto: solo en green ($(sched))" sched_owner_is green
check "el repo volvió a PREV_REF" test "$(git rev-parse HEAD)" = "$(git rev-parse v2)"
stop_probe D; check "D: cero respuestas no-200" test $? = 0

# ===== E. Falla el smoke =====
say "## E. Deploy que falla el smoke (v4: la API tira excepción)"
start_probe E
deploy v4-smoke SMOKE_TIMEOUT=15; rc=$?
check "deploy v4 falló (código != 0)" test "$rc" != 0
check "el log dice 'NO se conmuta'" grep -q "NO se conmuta" "$WORK/deploy-v4-smoke.log"
check "activo sigue siendo green" test "$(active_color)" = green
check "tráfico sigue en green" served_is green
check "scheduler intacto: solo en green ($(sched))" sched_owner_is green
stop_probe E; check "E: cero respuestas no-200" test $? = 0

# ===== F. Falla la verificación pública post-conmutación =====
say "## F. Falla la verificación pública después de conmutar (SMOKE_BASE incorrecto -> reversión automática)"
start_probe F
deploy v5-postswitch SMOKE_BASE=http://127.0.0.1:18091 SMOKE_TIMEOUT=6; rc=$?
check "deploy v5 falló (código != 0)" test "$rc" != 0
check "el log muestra la conmutación y la reversión" grep -q "REVIRTIENDO" "$WORK/deploy-v5-postswitch.log"
check "activo vuelve a green" test "$(active_color)" = green
check "tráfico en green" served_is green
check "scheduler: solo en green ($(sched))" sched_owner_is green
stop_probe F; check "F: cero respuestas no-200" test $? = 0

# ===== G. Migración destructiva =====
say "## G. Deploy con migración destructiva (v7)"
start_probe G
git checkout -q v6; PREV_BEFORE="$(git rev-parse HEAD)"
deploy v7-destructiva; rc=$?
check "deploy v7 rechazado (código != 0)" test "$rc" != 0
check "el log marca BREAKING y no construye" bash -c "grep -q BREAKING '$WORK/deploy-v7-destructiva.log' && ! grep -q 'Build de' '$WORK/deploy-v7-destructiva.log'"
stop_probe G; check "G: cero respuestas no-200" test $? = 0

# ===== H. Deploy exitoso después de las fallas =====
say "## H. Deploy exitoso tras las fallas (v6)"
start_probe H
deploy v6; rc=$?
check "deploy v6 OK" test "$rc" = 0
check "tráfico en blue con v6" ver_is v6
check "scheduler: solo en blue ($(sched))" sched_owner_is blue
check "mysql nunca se recreó en todo el ensayo" mysql_same
stop_probe H; check "H: cero respuestas no-200" test $? = 0

say ""
say "## Resumen: $FAILS verificaciones fallidas"
[ "${KEEP:-0}" = 1 ] || cleanup
exit $((FAILS > 0))
