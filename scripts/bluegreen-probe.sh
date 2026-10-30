#!/usr/bin/env bash
# Sondeo continuo del sitio durante un deploy: cuenta respuestas no-200 y qué color sirvió cada una.
#   scripts/bluegreen-probe.sh <base-url> <archivo-salida> [intervalo=0.2]
# Corre 3 sondas en paralelo (home, API con base de datos, marca de color) hasta SIGINT/SIGTERM; entonces imprime
# el resumen y sale con 1 si hubo alguna respuesta distinta de 200 (o timeout de 5 s), 0 si no.
set -uo pipefail
BASE="${1:?Uso: $0 <base-url> <archivo-salida> [intervalo]}"; OUT="${2:?}"; INT="${3:-0.2}"
: > "$OUT"
probe() { # nombre url
  while true; do
    code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' "$2" || true)"; [ -z "$code" ] && code=000
    echo "$(date +%s.%N) $1 $code" >> "$OUT"
    sleep "$INT"
  done
}
colorprobe() {
  while true; do
    body="$(curl -s -m 5 -w ' %{http_code}' "$BASE/api/color.txt" || true)"
    echo "$(date +%s.%N) color ${body##* } ${body%% *}" >> "$OUT"
    sleep "$INT"
  done
}
probe home "$BASE/" & P1=$!
probe stats "$BASE/api/api/v1/contracts/stats" & P2=$!
colorprobe & P3=$!
trap 'kill $P1 $P2 $P3 2>/dev/null; wait 2>/dev/null; summary; exit $RC' INT TERM
summary() {
  total=$(wc -l < "$OUT")
  bad=$(awk '$2!="color" && $3!="200"' "$OUT" | wc -l)
  badc=$(awk '$2=="color" && $3!="200"' "$OUT" | wc -l)
  echo "sondeo: $total muestras, no-200: $((bad + badc)) (home/stats: $bad, color: $badc)"
  awk '$2=="color" && $3=="200"{c[$4]++; if(!($4 in f))f[$4]=$1} END{for(k in c)printf "  color %-6s %d muestras (primera: %s)\n",k,c[k],f[k]}' "$OUT"
  awk '$2!="color" && $3!="200"{print "  NO-200: " $0}' "$OUT" | head -20
  RC=0; [ $((bad + badc)) -gt 0 ] && RC=1
}
RC=0
wait
