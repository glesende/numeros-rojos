# Backlog inicial (Admisión, 2026-10-29)

Urgentes
1. Cerrar MySQL (3309) y Redis (16379) a internet: Docker publica sobre 0.0.0.0 y salta ufw; Redis no tiene contraseña. Publicar en `127.0.0.1` (como Parkium #61).
2. Backup diario de la base con cron, verificación de antigüedad y restore ensayado (modelo: Parkium).
3. Deploy seguro: build antes de bajar, tests antes de taggear, smoke test, rollback automático.
4. Monitoreo de las sincronizaciones mensuales BCRA (latido en la base o log persistente) y logs a volumen/stdout.

Importantes
5. Credenciales débiles en `.env.prod` (DB y JWT): rotar a valores aleatorios, permisos 600 (hoy 664).
6. CI en GitHub Actions (phpunit + build del frontend) y correr/medir los tests.
7. `composer audit` / `npm audit` y actualizar dependencias.
8. Higiene: borrar ramas `task-*` viejas; README (Lumen→Laravel).
