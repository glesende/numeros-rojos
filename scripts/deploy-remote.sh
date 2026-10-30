#!/usr/bin/env bash
# (Stack único; desde #143 producción usa scripts/deploy-bluegreen.sh y este script se niega a correr mientras .bluegreen/active sea blue|green.)
# Despliegue en el VPS con caída mínima, backup previo, smoke test y reversión automática.
# Uso (desde ~/projects/numeros-rojos en el VPS, con el tag ya checkouteado):
#   PREV_REF=<commit/tag anterior> scripts/deploy-remote.sh <TAG>
# Orden: backup de la DB -> build (con el stack viejo sirviendo) -> up (recrea solo lo cambiado) -> migrate
#        -> smoke test -> si falla, vuelve a PREV_REF y reconstruye. Sale con código != 0 si falla.
# Variables: SMOKE_BASE (def. https://numerosrojos.net), SMOKE_TIMEOUT segundos (def. 120).
set -uo pipefail

TAG="${1:?Uso: PREV_REF=<ref> $0 <TAG>}"
PREV_REF="${PREV_REF:-}"
SMOKE_BASE="${SMOKE_BASE:-https://numerosrojos.net}"
SMOKE_TIMEOUT="${SMOKE_TIMEOUT:-120}"
. "$(dirname "$0")/lib-deploy.sh"
refuse_if_bluegreen || exit 1

migrate() {
  log "Esperando MySQL y migrando"
  "${DC[@]}" exec -T mysql sh -c 'until mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" --silent; do sleep 2; done' &&
    "${DC[@]}" exec -T api php artisan migrate --force
}

rollback() {
  log "REVERSIÓN: volviendo a ${PREV_REF:-<desconocido>}"
  if [ -z "$PREV_REF" ]; then
    log "Sin PREV_REF: no se puede revertir automáticamente"; return 1
  fi
  git checkout -q "$PREV_REF" && "${DC[@]}" build --quiet && "${DC[@]}" up -d || return 1
  if smoke; then log "Reversión OK: producción sirve la versión anterior"; else log "Reversión SIN verificar: revisar a mano"; fi
  log "ATENCIÓN: las migraciones NO se revierten solas (ver docs/operacion.md > Rollback)"
}

# Sin dump verificado no se toca nada: el script de backup valida el gzip y el "Dump completed".
log "Backup de la DB antes de $TAG"
if ! scripts/backup-db.sh; then
  log "Backup falló: no se despliega, producción no se tocó"
  [ -n "$PREV_REF" ] && git checkout -q "$PREV_REF"
  exit 1
fi

log "Build de $TAG con el stack actual sirviendo"
if ! "${DC[@]}" build --quiet; then
  log "Build falló: producción no se tocó"
  [ -n "$PREV_REF" ] && git checkout -q "$PREV_REF"
  exit 1
fi

log "Levantando $TAG"
if ! "${DC[@]}" up -d || ! migrate || ! smoke; then
  rollback
  exit 1
fi

docker image prune -f >/dev/null
# Precalentar caché de BeSoccer: no es crítico, no revierte el deploy si falla.
"${DC[@]}" exec -T api php artisan besoccer:warm-cache || log "AVISO: besoccer:warm-cache falló (no bloquea)"
log "Deploy $TAG completado y verificado"
