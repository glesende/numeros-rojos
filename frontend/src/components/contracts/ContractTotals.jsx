import StatCard from '../common/StatCard';

export default function ContractTotals({ totals }) {
  if (!totals) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <StatCard label="Total contratos" value={totals.total_contratos} />
      <StatCard label="Vigentes" value={totals.contratos_vigentes} />
      <StatCard label="Vencidos" value={totals.contratos_vencidos} />
      <StatCard label="Prom. % pase" value={`${totals.promedio_porcentaje_pase}%`} />
      <StatCard
        label="Salarios USD"
        value={new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(totals.total_salarios_usd)}
        sub="Total estimado mensual"
      />
      <StatCard
        label="Salarios ARS"
        value={new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS',
          maximumFractionDigits: 0,
        }).format(totals.total_salarios_ars)}
        sub="Total estimado mensual"
      />
    </div>
  );
}
