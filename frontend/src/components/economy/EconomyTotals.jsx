import StatCard from '../common/StatCard';

function fmt(n, currency) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function EconomyTotals({ totals }) {
  if (!totals) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      <StatCard label="Cobros ARS" value={fmt(totals.total_cobros_ars, 'ARS')} />
      <StatCard label="Pagos ARS" value={fmt(totals.total_pagos_ars, 'ARS')} />
      <StatCard label="Cobros USD" value={fmt(totals.total_cobros_usd, 'USD')} />
      <StatCard label="Pagos USD" value={fmt(totals.total_pagos_usd, 'USD')} />
      <StatCard label="Cobros EUR" value={fmt(totals.total_cobros_eur, 'EUR')} />
      <StatCard label="Pagos EUR" value={fmt(totals.total_pagos_eur, 'EUR')} />
      <StatCard
        label="Balance ARS"
        value={fmt(totals.balance_ars, 'ARS')}
        sub={totals.balance_ars >= 0 ? 'Positivo' : 'Negativo'}
      />
      <StatCard
        label="Balance USD"
        value={fmt(totals.balance_usd, 'USD')}
        sub={totals.balance_usd >= 0 ? 'Positivo' : 'Negativo'}
      />
      <StatCard
        label="Balance EUR"
        value={fmt(totals.balance_eur, 'EUR')}
        sub={totals.balance_eur >= 0 ? 'Positivo' : 'Negativo'}
      />
      <StatCard label="Total registros" value={totals.cantidad} />
    </div>
  );
}
