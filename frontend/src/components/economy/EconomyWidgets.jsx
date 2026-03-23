import StatCard from '../common/StatCard';

function formatMoney(amount, currency) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function BalanceValue({ amount, currency }) {
  const colorClass = amount >= 0 ? 'text-ingreso' : 'text-egreso';
  return (
    <span className={`text-2xl font-bold ${colorClass}`}>
      {formatMoney(amount, currency)}
    </span>
  );
}

export default function EconomyWidgets({ totals }) {
  if (!totals) return null;

  const currencies = [
    {
      code: 'ARS',
      cobros: totals.total_cobros_ars ?? 0,
      pagos: totals.total_pagos_ars ?? 0,
      balance: totals.balance_ars ?? 0,
    },
    {
      code: 'USD',
      cobros: totals.total_cobros_usd ?? 0,
      pagos: totals.total_pagos_usd ?? 0,
      balance: totals.balance_usd ?? 0,
    },
    {
      code: 'EUR',
      cobros: totals.total_cobros_eur ?? 0,
      pagos: totals.total_pagos_eur ?? 0,
      balance: totals.balance_eur ?? 0,
    },
  ].filter((c) => c.cobros !== 0 || c.pagos !== 0);

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total registros"
          value={totals.cantidad ?? 0}
          sub="compromisos económicos"
        />
        {currencies.map((c) => (
          <StatCard
            key={`cobros-${c.code}`}
            label={`Total cobros ${c.code}`}
            value={formatMoney(c.cobros, c.code)}
            sub="ingresos"
          />
        ))}
      </div>

      {currencies.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currencies.map((c) => (
            <StatCard
              key={`pagos-${c.code}`}
              label={`Total pagos ${c.code}`}
              value={formatMoney(c.pagos, c.code)}
              sub="egresos"
            />
          ))}
          {currencies.map((c) => (
            <div key={`balance-${c.code}`} className="card text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Balance neto {c.code}
              </p>
              <BalanceValue amount={c.balance} currency={c.code} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
