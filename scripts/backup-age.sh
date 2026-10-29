#!/usr/bin/env bash
# Antigüedad del último backup válido de numeros-rojos (segundos). Sale con 1 si supera MAX_AGE_HOURS (def. 26) o no hay backup.
# Uso: scripts/backup-age.sh        Variables: BACKUP_DIR (def. ~/backups/numeros-rojos), MAX_AGE_HOURS
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/numeros-rojos}"
MAX=$(( ${MAX_AGE_HOURS:-26} * 3600 ))
LAST="$(ls -1t "$BACKUP_DIR"/numeros-rojos-*.sql.gz 2>/dev/null | head -n1 || true)"
[ -n "$LAST" ] || { echo "ERROR: no hay backups en $BACKUP_DIR" >&2; exit 1; }
gzip -t "$LAST" || { echo "ERROR: backup corrupto: $LAST" >&2; exit 1; }
AGE=$(( $(date +%s) - $(stat -c %Y "$LAST") ))
echo "numeros_rojos_backup_age_seconds $AGE ($(basename "$LAST"))"
[ "$AGE" -le "$MAX" ] || { echo "ERROR: último backup de hace más de $((MAX/3600)) h" >&2; exit 1; }
