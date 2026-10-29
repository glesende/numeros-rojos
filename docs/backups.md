# Backups de la DB de producción

- **Qué:** dump lógico diario de la DB `numeros_rojos` (`scripts/backup-db.sh`, se corre en el VPS): `mysqldump --single-transaction --routines --triggers`, comprimido, validado con `gzip -t` + marca "Dump completed"; si falla sale con error y no deja archivo parcial.
- **Dónde:** `~/backups/numeros-rojos/numeros-rojos-AAAAMMDD-HHMMSS-PID.sql.gz` (permisos 600, directorio 700), retención 14 días (`RETENTION_DAYS`). Los `pre-<tag>-*.sql.gz` manuales previos a un deploy conviven en el mismo directorio y no se rotan con este script.
- **Cuándo:** cron del usuario `ubuntu`, 03:35 UTC:
  `35 3 * * * cd ~/projects/numeros-rojos && scripts/backup-db.sh >> ~/backups/numeros-rojos/backup.log 2>&1`
- **Por qué propio:** `/usr/local/bin/mysql_backup.sh` (cron root 02:00) tiene una lista fija de proyectos y no incluye numeros-rojos.
- **Antigüedad:** `scripts/backup-age.sh` imprime la antigüedad del último dump válido y sale con 1 si supera 26 h (`MAX_AGE_HOURS`) o no hay backup. Cada backup exitoso escribe `~/backups/numeros-rojos/backup.prom` (`numeros_rojos_backup_last_success_timestamp_seconds`, `numeros_rojos_backup_last_size_bytes`) y una copia legible en `~/node-exporter-textfiles/numeros_rojos_backup.prom` (para el textfile collector de node-exporter).
- **Métrica en la oficina:** `config/proyectos/numeros-rojos.toml` → `antiguedad_backup` (horas desde el último dump, alerta si > 26 h).
- **Probar que sirve (no toca producción):** `scripts/restore-db.sh --verify ~/backups/numeros-rojos/<archivo>.sql.gz` (mysql:8.0 temporal aislado, restaura y cuenta filas exactas).
- **Restaurar sobre producción:** `scripts/restore-db.sh --prod <archivo>` desde `~/projects/numeros-rojos` en el VPS (pide escribir `restaurar` y hace un dump de seguridad antes). Es el plan de vuelta atrás para migraciones.
- **Backup manual antes de un deploy con migraciones:** `ssh ubuntu@148.113.207.54 "cd ~/projects/numeros-rojos && scripts/backup-db.sh"`.

## Limitaciones / pendiente
- Los dumps viven solo en el VPS (mismo disco que la DB). Falta copia externa (como `parkium/scripts/pull-backups.sh`); el destino definitivo y cifrado lo decide el CEO.
- No hay alerta por Prometheus/Alertmanager para esta métrica todavía (el archivo `.prom` ya se publica en el textfile collector); la alerta de la oficina cubre la antigüedad.
