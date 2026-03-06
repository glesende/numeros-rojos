import { useState, useEffect } from 'react';
import { getEconomyRecords } from '../api/endpoints';
import { useFilters } from '../hooks/useFilters';
import EconomyFilters from '../components/economy/EconomyFilters';
import EconomyTable from '../components/economy/EconomyTable';
import EconomyTotals from '../components/economy/EconomyTotals';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';

export default function EconomyPage() {
  const { filters, updateFilter, setPage, resetFilters, cleanParams } = useFilters();
  const [data, setData] = useState({ data: [], totals: null, meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getEconomyRecords(cleanParams())
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Transparencia Economica</h1>
      <p className="text-gray-500 text-sm mb-6">
        Ingresos y egresos del Club Atletico Independiente.
      </p>

      <EconomyTotals totals={data.totals} />
      <EconomyFilters filters={filters} onFilter={updateFilter} onReset={resetFilters} />

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <EconomyTable records={data.data} />
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
