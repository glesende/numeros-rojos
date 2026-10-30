#!/bin/sh
# Lanza `schedule:work` bajo supervisor (programa laravel-scheduler).
# Sin BG_ACTIVE_FILE (dev, stack único) arranca directo. En el deploy blue/green (docs/bluegreen.md) corre
# solo mientras el archivo de color activo diga que este contenedor (COLOR) es el activo: así hay UN scheduler
# aunque haya dos colores arriba, y se reasigna solo si el contenedor se reinicia. Revisa cada 2 s.
APP=/var/www/html/artisan
if [ -z "${BG_ACTIVE_FILE:-}" ]; then
  exec php "$APP" schedule:work
fi

pid=""
trap '[ -n "$pid" ] && kill "$pid" 2>/dev/null; exit 0' TERM INT
while true; do
  active="$(cat "$BG_ACTIVE_FILE" 2>/dev/null || true)"
  if [ "$active" = "$COLOR" ]; then
    if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
      php "$APP" schedule:work &
      pid=$!
    fi
  elif [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null
    wait "$pid" 2>/dev/null
    pid=""
  fi
  sleep 2
done
