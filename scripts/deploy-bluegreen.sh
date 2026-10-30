#!/usr/bin/env bash
# Deploy blue/green sin caída (se corre EN el VPS, desde ~/projects/numeros-rojos, con el tag ya checkouteado).
#   PREV_REF=<commit anterior> scripts/deploy-bluegreen.sh <TAG> [--stop-old]
# Orden: guardas -> chequeo de migraciones compatibles -> backup -> build del color INACTIVO (el activo sirve)
#   -> up del inactivo con la versión nueva -> migrate -> smoke DIRECTO al color nuevo -> switch-color.sh
#   (nginx reload + verificación pública; si falla, revierte solo al color anterior).
# Si algo falla ANTES de conmutar, el tráfico nunca se movió: 0 cortes. Diseño y reglas: docs/bluegreen.md.
# --stop-old: al terminar, baja el color anterior (pierde el rollback instantáneo; por defecto queda arriba).
# Variables: ver scripts/lib-bluegreen.sh; BACKUP_CMD (def. scripts/backup-db.sh); ALLOW_BREAKING_MIGRATION=1.
set -uo pipefail

TAG="${1:?Uso: PREV_REF=<ref> $0 <TAG> [--stop-old]}"
STOP_OLD=0; [ "${2:-}" = "--stop-old" ] && STOP_OLD=1
PREV_REF="${PREV_REF:-}"
BACKUP_CMD="${BACKUP_CMD:-scripts/backup-db.sh}"
. "$(dirname "$0")/lib-bluegreen.sh"

back_to_prev() { [ -n "$PREV_REF" ] && git checkout -q "$PREV_REF"; }

# Todo en una función: `git checkout` reemplaza archivos del repo mientras bash sigue leyendo este script.
main() {
  init_state
  local old new; old="$(active_color)"; new="$(other_color "$old")"
  log "Deploy $TAG: activo=${old:-ninguno} -> se despliega en $new (puertos $(api_port "$new")/$(front_port "$new"))"

  # Guardas: datos arriba y sano (no se tocan nunca) y el include de nginx ya apuntando al activo.
  if [ "$(docker inspect -f '{{.State.Health.Status}}' "$DATA_PROJECT-mysql-1" 2>/dev/null)" != healthy ]; then
    log "mysql ($DATA_PROJECT-mysql-1) no está healthy: no se despliega, nada se tocó"; back_to_prev; return 1
  fi
  if [ -z "$old" ] || [ "$old" = legacy ] && [ "${FIRST_COLOR:-0}" != 1 ]; then
    log "Estado '${old:-vacío}': el stack único todavía no se migró a blue/green (ver docs/bluegreen.md > Migración). No se despliega"
    back_to_prev; return 1
  fi

  if [ -n "$PREV_REF" ]; then
    scripts/check-migrations-compat.sh "$PREV_REF" HEAD
    local rc=$?
    if [ "$rc" = 2 ] && [ "${ALLOW_BREAKING_MIGRATION:-0}" != 1 ]; then
      log "Migración incompatible hacia atrás: sin ALLOW_BREAKING_MIGRATION=1 no se despliega (ver docs/bluegreen.md > Migraciones)"
      back_to_prev; return 1
    fi
  fi

  log "Backup de la DB antes de $TAG"
  if ! $BACKUP_CMD; then log "Backup falló: no se despliega, producción no se tocó"; back_to_prev; return 1; fi

  log "Build de $TAG en $new (el color $old sigue sirviendo)"
  if ! dc "$new" build --quiet; then log "Build falló: no se conmuta, producción no se tocó"; back_to_prev; return 1; fi

  log "Levantando $new con $TAG"
  if ! dc "$new" up -d --force-recreate; then log "up falló: no se conmuta"; back_to_prev; return 1; fi

  log "Migrando con $new (el color $old sigue sirviendo contra la misma base)"
  if ! dcdata exec -T mysql sh -c 'until mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" --silent; do sleep 2; done' ||
     ! dc "$new" exec -T api php artisan migrate --force; then
    log "migrate falló: no se conmuta. Revisar migración (docs/operacion.md > Rollback B/C)"; back_to_prev; return 1
  fi

  log "Smoke directo a $new"
  if ! smoke_color "$new"; then
    log "Smoke falló: NO se conmuta; producción sigue en $old sin cortes. $new queda arriba para diagnóstico"
    dc "$new" logs --tail 30 api 2>&1 | sed 's/^/    /'
    back_to_prev; return 1
  fi

  if ! scripts/switch-color.sh "$new"; then
    log "La conmutación falló (switch-color.sh ya revirtió a $old si pudo). Verificar a mano: scripts/switch-color.sh $old"
    back_to_prev; return 1
  fi

  docker image prune -f >/dev/null
  dc "$new" exec -T api php artisan besoccer:warm-cache || log "AVISO: besoccer:warm-cache falló (no bloquea)"
  if [ "$STOP_OLD" = 1 ] && valid_color "$old"; then log "Bajando el color anterior $old"; dc "$old" stop; fi
  log "Deploy $TAG completado: activo=$new. Rollback instantáneo: scripts/switch-color.sh $old (mientras $old siga arriba)"
}
main
exit $?
