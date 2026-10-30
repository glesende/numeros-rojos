#!/usr/bin/env bash
# Detecta migraciones NO compatibles hacia atrás entre dos refs (regla expand/contract, docs/bluegreen.md).
#   scripts/check-migrations-compat.sh <base-ref> [head-ref=HEAD]
# Durante un deploy blue/green la versión vieja sigue sirviendo contra la base ya migrada por la nueva.
# Salida: 0 = sin hallazgos (o solo avisos), 2 = hay cambios destructivos (BREAKING), 1 = error de uso.
# Heurística por texto sobre las migraciones nuevas/modificadas: no reemplaza leerlas.
set -uo pipefail
BASE="${1:?Uso: $0 <base-ref> [head-ref]}"; HEAD_REF="${2:-HEAD}"
DIR=backend/database/migrations
git rev-parse -q --verify "$BASE^{commit}" >/dev/null || { echo "Ref desconocida: $BASE" >&2; exit 1; }

BREAK='dropColumn|dropIfExists|Schema::drop\(|->drop\(|renameColumn|Schema::rename|->rename\(|->change\(|dropForeign|dropIndex|dropUnique|dropPrimary|truncate|DB::(statement|unprepared)\(.*(DROP|RENAME|MODIFY|CHANGE|TRUNCATE)'
rc=0; n=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  n=$((n + 1))
  # Solo el up(): lo que corre al migrar.
  up="$(git show "$HEAD_REF:$f" | awk '/function up\(/{p=1} /function down\(/{p=0} p')"
  hits="$(printf '%s\n' "$up" | grep -nE "$BREAK" || true)"
  if [ -n "$hits" ]; then
    echo "BREAKING  $f"; printf '%s\n' "$hits" | sed 's/^/            /'; rc=2
  fi
  # Columna NOT NULL sin default agregada a una tabla existente: el INSERT de la versión vieja la rompe.
  if printf '%s\n' "$up" | grep -q 'Schema::table('; then
    warn="$(printf '%s\n' "$up" | grep -nE '\$table->(string|text|integer|bigInteger|unsignedBigInteger|boolean|decimal|date|dateTime|timestamp|json|enum|foreignId)\(' | grep -vE 'nullable|default|constrained.*nullable' || true)"
    [ -n "$warn" ] && { echo "AVISO     $f: columna agregada sin ->nullable()/->default() (la versión vieja no la conoce al insertar)"; printf '%s\n' "$warn" | sed 's/^/            /'; }
  fi
done < <(git diff --name-only --diff-filter=AM "$BASE..$HEAD_REF" -- "$DIR")

[ "$n" = 0 ] && echo "Sin migraciones nuevas entre $BASE y $HEAD_REF."
[ "$rc" = 2 ] && echo "=> Hay cambios destructivos: la versión anterior puede romper mientras conviva. Separar en dos releases (expand, luego contract) o ALLOW_BREAKING_MIGRATION=1 aceptando un corte."
exit "$rc"
