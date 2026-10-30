#!/usr/bin/env bash
# Conmuta el tráfico público al color indicado: reescribe el include de nginx del host y hace reload graceful
# (`nginx -t && nginx -s reload`: 0 cortes), reasigna el scheduler y verifica por la ruta pública.
# También sirve de rollback: `scripts/switch-color.sh <color-anterior>` (el color viejo sigue arriba).
#   scripts/switch-color.sh <blue|green> [--no-verify]
# Se corre en el VPS desde ~/projects/numeros-rojos. Variables: ver scripts/lib-bluegreen.sh.
set -uo pipefail
TO="${1:?Uso: $0 <blue|green> [--no-verify]}"
VERIFY=1; [ "${2:-}" = "--no-verify" ] && VERIFY=0
. "$(dirname "$0")/lib-bluegreen.sh"
valid_color "$TO" || { echo "Color inválido: $TO (blue|green)" >&2; exit 1; }
init_state

FROM="$(active_color)"
[ "$FROM" = "$TO" ] && { log "$TO ya es el color activo: nada que hacer"; exit 0; }

# Nunca se conmuta hacia un color que no responde.
if ! smoke_color "$TO"; then log "El color $TO no pasa el smoke directo: NO se conmuta (tráfico sigue en ${FROM:-?})"; exit 1; fi

PREV_CONF="$(cat "$NGINX_ACTIVE_CONF" 2>/dev/null || true)"
TMP="$BG_STATE_DIR/nr-active-color.conf.new"
render_conf "$TO" > "$TMP"
$NGINX_SUDO cp "$TMP" "$NGINX_ACTIVE_CONF" || { log "No pude escribir $NGINX_ACTIVE_CONF"; exit 1; }
if ! $NGINX_TEST_CMD; then
  log "nginx -t falló: restauro el include anterior, no se recarga"
  if [ -n "$PREV_CONF" ]; then printf '%s\n' "$PREV_CONF" > "$TMP"; $NGINX_SUDO cp "$TMP" "$NGINX_ACTIVE_CONF"; fi
  exit 1
fi
$NGINX_RELOAD_CMD || { log "nginx reload falló"; exit 1; }
log "Tráfico conmutado: ${FROM:-?} -> $TO"

scheduler_handover "$TO" || log "AVISO: revisar el scheduler a mano (docs/bluegreen.md)"

if [ "$VERIFY" = 1 ]; then
  if ! smoke_public "$TO"; then
    log "La ruta pública no sirve $TO correctamente"
    if valid_color "$FROM"; then
      log "REVIRTIENDO a $FROM"
      render_conf "$FROM" > "$TMP"; $NGINX_SUDO cp "$TMP" "$NGINX_ACTIVE_CONF" && $NGINX_TEST_CMD && $NGINX_RELOAD_CMD
      scheduler_handover "$FROM" || true
    fi
    exit 1
  fi
fi
log "Color activo: $TO"
