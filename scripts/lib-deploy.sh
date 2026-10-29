#!/usr/bin/env bash
# Funciones comunes de deploy-remote.sh y rollback-remote.sh (se hace source; no ejecutar).
# Requiere SMOKE_BASE y SMOKE_TIMEOUT definidos por quien la carga.
DC=(docker compose -f docker-compose.prod.yml --env-file .env.prod)

log() { echo "[deploy $(date -u +%H:%M:%S)] $*"; }

http_code() { curl -s -o /dev/null -m 10 -w '%{http_code}' "$1" || true; }

# Espera hasta que $1 (URL) devuelva el código $2.
wait_code() {
  local url="$1" want="$2" end=$((SECONDS + SMOKE_TIMEOUT)) got=""
  while [ "$SECONDS" -lt "$end" ]; do
    got="$(http_code "$url")"
    [ "$got" = "$want" ] && { log "OK $url -> $got"; return 0; }
    sleep 3
  done
  log "FALLO $url -> $got (esperado $want)"
  return 1
}

# Espera hasta que $1 (URL) devuelva 200 con el texto $2 en el cuerpo.
wait_body() {
  local url="$1" want="$2" end=$((SECONDS + SMOKE_TIMEOUT))
  while [ "$SECONDS" -lt "$end" ]; do
    curl -s -m 10 "$url" | grep -q "$want" && { log "OK $url contiene $want"; return 0; }
    sleep 3
  done
  log "FALLO $url no contiene $want"
  return 1
}

# Sitio 200, API "running", endpoint real con base 200 y scheduler vivo. Devuelve 0 solo si todo pasa.
smoke() {
  local ok=0
  wait_code "$SMOKE_BASE/" 200 || ok=1
  wait_body "$SMOKE_BASE/api/" '"status":"running"' || ok=1
  wait_code "$SMOKE_BASE/api/api/v1/contracts/stats" 200 || ok=1
  local end=$((SECONDS + SMOKE_TIMEOUT))
  while [ "$SECONDS" -lt "$end" ]; do
    if "${DC[@]}" exec -T api sh -c 'ps | grep -q "[s]chedule:work"' >/dev/null 2>&1; then
      log "OK scheduler: schedule:work vivo"; return $ok
    fi
    sleep 3
  done
  log "FALLO scheduler: no hay proceso schedule:work en el contenedor api"
  return 1
}
