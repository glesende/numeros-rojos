#!/usr/bin/env bash
# Restaura un dump de scripts/backup-db.sh.
#   scripts/restore-db.sh --verify ARCHIVO.sql.gz   Prueba la restauración en un MySQL temporal (no toca producción)
#   scripts/restore-db.sh --prod   ARCHIVO.sql.gz   Restaura SOBRE la DB de producción (pisa los datos; pide confirmación)
set -euo pipefail

MODE="${1:-}"; FILE="${2:-}"
[ -n "$FILE" ] && [ -f "$FILE" ] && { [ "$MODE" = --verify ] || [ "$MODE" = --prod ]; } || {
  echo "Uso: $0 --verify|--prod ARCHIVO.sql.gz" >&2; exit 1; }
gzip -t "$FILE"

if [ "$MODE" = --verify ]; then
  NAME="numeros-rojos-restore-test-$$"
  trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT
  docker run -d --name "$NAME" -e MYSQL_ROOT_PASSWORD=test -e MYSQL_DATABASE=numeros_rojos mysql:8.0 >/dev/null
  for _ in $(seq 1 60); do
    docker exec "$NAME" mysqladmin ping -h 127.0.0.1 --protocol=TCP -uroot -ptest --silent 2>/dev/null && break; sleep 2
  done
  # El entrypoint reinicia MySQL tras inicializar: esperar a que responda de forma estable
  sleep 5
  gzip -dc "$FILE" | docker exec -i "$NAME" mysql -uroot -ptest numeros_rojos 2>/dev/null
  echo "Tablas restauradas / filas:"
  # COUNT(*) exacto (information_schema.table_rows es solo una estimación)
  for t in $(docker exec "$NAME" mysql -uroot -ptest -N numeros_rojos 2>/dev/null -e "SHOW TABLES"); do
    printf '%s\t%s\n' "$t" "$(docker exec "$NAME" mysql -uroot -ptest -N numeros_rojos 2>/dev/null -e "SELECT COUNT(*) FROM \`$t\`")"
  done
  echo "OK: el backup se restaura correctamente"
else
  cd "$(dirname "$0")/.."
  read -r -p "Esto PISA la DB de producción con $FILE. Escribí 'restaurar' para seguir: " ANS
  [ "$ANS" = restaurar ] || { echo "Cancelado"; exit 1; }
  # Antes de pisar, dump de seguridad del estado actual
  scripts/backup-db.sh
  gzip -dc "$FILE" | docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T mysql sh -c \
    'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot "$MYSQL_DATABASE"'
  echo "OK: restaurado $FILE"
fi
