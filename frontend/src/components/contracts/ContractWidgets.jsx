import StatCard from '../common/StatCard';

export default function ContractWidgets({ stats }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        label="Vencen en 6 meses"
        value={stats.vencen_6_meses}
        sub="Contratos"
      />
      <StatCard
        label="Vencen en 12 meses"
        value={stats.vencen_12_meses}
        sub="Contratos"
      />
      <StatCard
        label="Vencen en 18 meses"
        value={stats.vencen_18_meses}
        sub="Contratos"
      />
      <StatCard
        label="Total contratos"
        value={stats.total_contratos}
        sub="futbolístas"
      />
      <StatCard
        label="A préstamo"
        value={stats.jugadores_prestamo}
        sub="Cedidos a otro club"
      />
      <StatCard
        label="Surgidos de inferiores"
        value={stats.total_surgidos_inferiores}
        sub="Del plantel"
      />
    </div>
  );
}
