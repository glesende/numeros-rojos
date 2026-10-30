#!/usr/bin/env bash
# Funciones comunes del deploy blue/green (se hace source; no ejecutar). Diseño: docs/bluegreen.md.
# Todo es parametrizable por variables de entorno para poder ensayarlo aislado; los defaults son los de producción.
BG_PREFIX="${BG_PREFIX:-nr}"                              # proyectos compose: nr-blue / nr-green
DATA_PROJECT="${DATA_PROJECT:-numeros-rojos}"            # proyecto de mysql+redis (el actual de producción)
ENV_FILE="${ENV_FILE:-.env.prod}"
BG_STATE_DIR="${BG_STATE_DIR:-$PWD/.bluegreen}"          # `active` + color-<c>.txt (se montan en los contenedores)
NGINX_ACTIVE_CONF="${NGINX_ACTIVE_CONF:-/etc/nginx/conf.d/nr-active-color.conf}"
NGINX_SUDO="${NGINX_SUDO-sudo}"                          # prefijo para escribir el include y recargar ("" si no hace falta)
NGINX_TEST_CMD="${NGINX_TEST_CMD:-$NGINX_SUDO nginx -t}"
NGINX_RELOAD_CMD="${NGINX_RELOAD_CMD:-$NGINX_SUDO nginx -s reload}"
BLUE_API_PORT="${BLUE_API_PORT:-8085}";  BLUE_FRONT_PORT="${BLUE_FRONT_PORT:-3005}"   # los puertos que hoy usa producción
GREEN_API_PORT="${GREEN_API_PORT:-8185}"; GREEN_FRONT_PORT="${GREEN_FRONT_PORT:-3105}"
SMOKE_BASE="${SMOKE_BASE:-https://numerosrojos.net}"
SMOKE_TIMEOUT="${SMOKE_TIMEOUT:-120}"

log() { echo "[bluegreen $(date -u +%H:%M:%S)] $*"; }

other_color() { case "$1" in blue) echo green ;; green) echo blue ;; *) echo green ;; esac; }
valid_color() { [ "$1" = blue ] || [ "$1" = green ]; }

# Color actualmente activo: blue|green|legacy (stack único anterior, aún sin migrar)|"" (nada configurado).
active_color() { cat "$BG_STATE_DIR/active" 2>/dev/null || true; }

api_port()   { case "$1" in blue) echo "$BLUE_API_PORT" ;; green) echo "$GREEN_API_PORT" ;; esac; }
front_port() { case "$1" in blue) echo "$BLUE_FRONT_PORT" ;; green) echo "$GREEN_FRONT_PORT" ;; esac; }

# docker compose del color $1 (resto de args = args de compose).
dc() {
  local c="$1"; shift
  COLOR="$c" API_PORT="$(api_port "$c")" FRONT_PORT="$(front_port "$c")" BG_STATE_DIR="$BG_STATE_DIR" \
    docker compose -p "$BG_PREFIX-$c" -f docker-compose.bluegreen.yml --env-file "$ENV_FILE" "$@"
}
dcdata() { docker compose -p "$DATA_PROJECT" -f docker-compose.data.yml --env-file "$ENV_FILE" "$@"; }

# Crea el estado si falta. Los archivos color-*.txt deben existir antes de levantar un color (si no, docker crea carpetas).
init_state() {
  mkdir -p "$BG_STATE_DIR"
  printf blue > "$BG_STATE_DIR/color-blue.txt"; printf green > "$BG_STATE_DIR/color-green.txt"
  chmod 755 "$BG_STATE_DIR"; chmod 644 "$BG_STATE_DIR"/color-*.txt
  [ -f "$BG_STATE_DIR/active" ] || { printf legacy > "$BG_STATE_DIR/active"; chmod 644 "$BG_STATE_DIR/active"; }
}
# Escritura in-place (no mv): el archivo está montado en los contenedores por inode.
set_active_file() { printf '%s' "$1" > "$BG_STATE_DIR/active"; }

http_code() { curl -s -o /dev/null -m 10 -w '%{http_code}' "$1" || true; }

wait_code() {
  local url="$1" want="$2" end=$((SECONDS + SMOKE_TIMEOUT)) got=""
  while [ "$SECONDS" -lt "$end" ]; do
    got="$(http_code "$url")"
    [ "$got" = "$want" ] && { log "OK $url -> $got"; return 0; }
    sleep 2
  done
  log "FALLO $url -> $got (esperado $want)"; return 1
}
wait_body() {
  local url="$1" want="$2" end=$((SECONDS + SMOKE_TIMEOUT))
  while [ "$SECONDS" -lt "$end" ]; do
    curl -s -m 10 "$url" | grep -q "$want" && { log "OK $url contiene $want"; return 0; }
    sleep 2
  done
  log "FALLO $url no contiene $want"; return 1
}

# Smoke DIRECTO a un color (por su puerto, sin pasar por nginx del host). Devuelve 0 solo si todo pasa.
smoke_color() {
  local c="$1" api front ok=0
  api="http://127.0.0.1:$(api_port "$c")"; front="http://127.0.0.1:$(front_port "$c")"
  wait_code "$front/" 200 || ok=1
  wait_body "$api/" '"status":"running"' || ok=1
  wait_code "$api/api/v1/contracts/stats" 200 || ok=1
  wait_body "$api/color.txt" "$c" || ok=1
  # El scheduler tiene que poder arrancar (supervisor con el programa vivo); no corre hasta que el color sea el activo.
  dc "$c" exec -T api php artisan schedule:list >/dev/null 2>&1 && log "OK $c: schedule:list" || { log "FALLO $c: schedule:list"; ok=1; }
  return $ok
}

# Smoke por la ruta pública (nginx del host) y que la sirva el color $1.
smoke_public() {
  local c="$1" ok=0
  wait_code "$SMOKE_BASE/" 200 || ok=1
  wait_body "$SMOKE_BASE/api/" '"status":"running"' || ok=1
  wait_code "$SMOKE_BASE/api/api/v1/contracts/stats" 200 || ok=1
  wait_body "$SMOKE_BASE/api/color.txt" "$c" || ok=1
  wait_body "$SMOKE_BASE/color.txt" "$c" || ok=1
  return $ok
}

# Contenido del include de nginx del host para el color $1 (upstreams con sus puertos).
render_conf() {
  printf '# Generado por scripts/switch-color.sh (color activo: %s). No editar a mano.\nupstream nr_api   { server 127.0.0.1:%s; }\nupstream nr_front { server 127.0.0.1:%s; }\n' \
    "$1" "$(api_port "$1")" "$(front_port "$1")"
}

# Cantidad de procesos schedule:work vivos en el color $1 (0 si el contenedor no existe).
scheduler_count() {
  dc "$1" exec -T api sh -c 'ps | grep -c "[s]chedule:work"' 2>/dev/null | tr -d '[:space:]' || true
}

# Traspaso del scheduler: primero se apaga el del color saliente (active=none), se espera a que no quede
# ningún schedule:work, y recién entonces el entrante lo arranca. Nunca hay dos; el hueco es de ~2-6 s.
scheduler_handover() {
  local to="$1" from end
  from="$(other_color "$to")"
  set_active_file none
  end=$((SECONDS + 30))
  while [ "$SECONDS" -lt "$end" ]; do
    [ "$(scheduler_count "$from")" = 0 ] || [ -z "$(dc "$from" ps -q api 2>/dev/null)" ] && break
    sleep 1
  done
  set_active_file "$to"
  end=$((SECONDS + 30))
  while [ "$SECONDS" -lt "$end" ]; do
    [ "$(scheduler_count "$to")" = 1 ] && { log "OK scheduler: corre en $to (y solo ahí)"; return 0; }
    sleep 1
  done
  log "FALLO scheduler: no arrancó en $to"; return 1
}
