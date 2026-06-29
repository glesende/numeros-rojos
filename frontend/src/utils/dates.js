// Copiado desde el proyecto RP (Reclamos Profesionales) y adaptado para NR.
// Centraliza el parsing y formateo de fechas para evitar duplicación y corregir
// desfasajes de zona horaria cuando se usa `new Date("YYYY-MM-DD")` directamente.

/**
 * Parses a date string into a local Date object, avoiding timezone shifts.
 * Handles formats: YYYY-MM-DD, YYYY-MM-DDTHH:MM:SS.ffffffZ, YYYY-MM-DD HH:MM:SS
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const datePart = String(dateStr).slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/**
 * Formats a date string as DD-MM-YYYY. Returns '-' if the date is falsy or invalid.
 */
export function formatLocalDate(dateStr) {
  if (!dateStr) return '-';
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats a date string in long format (e.g. "lunes, 29 de junio de 2026").
 * Returns '-' if the date is falsy or invalid.
 */
export function formatLocalDateLong(dateStr) {
  if (!dateStr) return '-';
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
