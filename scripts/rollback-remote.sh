#!/usr/bin/env bash
# Vuelve producción a una versión anterior (se corre EN el VPS, desde ~/projects/numeros-rojos).
#   scripts/rollback-remote.sh <TAG_ANTERIOR> [--migrations]
# --migrations: antes de cambiar el código corre `migrate:rollback --force` (última tanda = la del último deploy)
#   con el código NUEVO todavía sirviendo: la imagen vieja no trae los archivos de esas migraciones y no podría revertirlas.
#   Usar solo si el `down()` de esas migraciones es reversible y no pierde datos que importen; si no, ver docs/operacion.md.
# Luego: checkout del tag, build (el stack actual sigue sirviendo), up -d y smoke test.
# Variables: SMOKE_BASE (def. https://numerosrojos.net), SMOKE_TIMEOUT segundos (def. 120).
set -uo pipefail

TARGET="${1:?Uso: $0 <TAG_ANTERIOR> [--migrations]}"
WITH_MIGRATIONS="${2:-}"
SMOKE_BASE="${SMOKE_BASE:-https://numerosrojos.net}"
SMOKE_TIMEOUT="${SMOKE_TIMEOUT:-120}"
. "$(dirname "$0")/lib-deploy.sh"

# Todo en una función: git checkout reemplaza archivos del repo mientras bash sigue leyendo este script.
main() {
  git rev-parse -q --verify "$TARGET^{commit}" >/dev/null || { echo "Ref desconocida: $TARGET (¿git fetch --tags?)" >&2; exit 1; }
  FROM_REF="$(git rev-parse HEAD)"

  if [ "$WITH_MIGRATIONS" = "--migrations" ]; then
    log "Revirtiendo la última tanda de migraciones con el código actual ($(git rev-parse --short HEAD))"
    "${DC[@]}" exec -T api php artisan migrate:rollback --force || { log "migrate:rollback falló: no se tocó el código. Ver docs/operacion.md (restore de DB)"; exit 1; }
  elif [ -n "$WITH_MIGRATIONS" ]; then
    echo "Opción desconocida: $WITH_MIGRATIONS" >&2; exit 1
  fi

  log "Build de $TARGET con el stack actual sirviendo"
  git checkout -q "$TARGET" && "${DC[@]}" build || { log "Build falló: producción sigue con el código anterior"; git checkout -q "$FROM_REF"; exit 1; }
  log "Levantando $TARGET"
  "${DC[@]}" up -d || { log "up falló: revisar a mano"; exit 1; }
  if smoke; then log "Rollback a $TARGET completado y verificado"; else log "Rollback a $TARGET SIN verificar: revisar a mano"; exit 1; fi
}
main
exit $?
