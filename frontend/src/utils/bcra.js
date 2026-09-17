// BCRA "Central de Deudores" situación (1-6 risk rating scale)
const SITUATION_LABELS = {
  0: 'Sin deuda',
  1: 'Normal',
  2: 'Riesgo bajo',
  3: 'Riesgo medio',
  4: 'Riesgo alto',
  5: 'Irrecuperable',
  6: 'Irrecuperable por disposición técnica',
};

export function translateSituation(situation) {
  if (situation === null || situation === undefined) return '-';
  return SITUATION_LABELS[situation] ?? `Situación ${situation}`;
}

export const SITUATION_OPTIONS = Object.entries(SITUATION_LABELS).map(([value, label]) => ({ value, label }));

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatPeriodLabel(period) {
  if (!period || period.length !== 6) return period;
  const monthIndex = parseInt(period.slice(4, 6), 10) - 1;
  const year = period.slice(2, 4);
  return `${MONTH_LABELS[monthIndex] || ''} ${year}`;
}

export function formatUsd(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function formatArs(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
}

function formatCompactNumber(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (value / 1_000).toFixed(0) + 'K';
  return value.toFixed(0);
}

export function formatUsdCompact(value) {
  if (value === null || value === undefined) return '-';
  return `USD ${formatCompactNumber(value)}`;
}

export function formatArsCompact(value) {
  if (value === null || value === undefined) return '-';
  return `$ ${formatCompactNumber(value)}`;
}
