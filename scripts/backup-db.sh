#!/usr/bin/env bash
# Dump diario de la DB de producción (se corre EN el VPS, desde cron o a mano).
# Genera $BACKUP_DIR/numeros-rojos-AAAAMMDD-HHMMSS.sql.gz, lo valida y borra los de más de $RETENTION_DAYS días.
# Uso: scripts/backup-db.sh        Variables: BACKUP_DIR (def. ~/backups/numeros-rojos), RETENTION_DAYS (def. 14), TEXTFILE_DIR (def. ~/node-exporter-textfiles)
set -euo pipefail

cd "$(dirname "$0")/.."
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/numeros-rojos}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
PROD=(docker compose -f docker-compose.prod.yml --env-file .env.prod)

umask 077
mkdir -p "$BACKUP_DIR"
OUT="$BACKUP_DIR/numeros-rojos-$(date +%Y%m%d-%H%M%S)-$$.sql.gz"
TMP="$OUT.partial"
trap 'rm -f "$TMP"' EXIT

# La clave root queda dentro del contenedor (MYSQL_PWD), no aparece en la lista de procesos ni en logs.
"${PROD[@]}" exec -T mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE"' \
  | gzip -9 > "$TMP"

# Validación: gzip íntegro y el dump terminó bien (mysqldump escribe "Dump completed" al final).
gzip -t "$TMP"
if ! gzip -dc "$TMP" | tail -n 5 | grep -q 'Dump completed'; then
  echo "ERROR: el dump no terminó correctamente" >&2; exit 1
fi
mv "$TMP" "$OUT"
trap - EXIT

find "$BACKUP_DIR" -maxdepth 1 -name 'numeros-rojos-*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
# Métrica de antigüedad (formato textfile de Prometheus) para scripts/backup-age.sh y, si se habilita, node-exporter.
printf 'numeros_rojos_backup_last_success_timestamp_seconds %s\nnumeros_rojos_backup_last_size_bytes %s\n' \
  "$(date +%s)" "$(stat -c %s "$OUT")" > "$BACKUP_DIR/backup.prom"
# Copia legible para el textfile collector de node-exporter (corre como nobody; el dir de dumps es 700, por eso va aparte).
TEXTFILE_DIR="${TEXTFILE_DIR:-$HOME/node-exporter-textfiles}"
if [ -d "$TEXTFILE_DIR" ]; then
  cp "$BACKUP_DIR/backup.prom" "$TEXTFILE_DIR/numeros_rojos_backup.prom.tmp" && chmod 644 "$TEXTFILE_DIR/numeros_rojos_backup.prom.tmp" \
    && mv "$TEXTFILE_DIR/numeros_rojos_backup.prom.tmp" "$TEXTFILE_DIR/numeros_rojos_backup.prom"
fi

echo "OK $(date -Is) $OUT ($(du -h "$OUT" | cut -f1)); backups: $(find "$BACKUP_DIR" -maxdepth 1 -name 'numeros-rojos-*.sql.gz' | wc -l)"
