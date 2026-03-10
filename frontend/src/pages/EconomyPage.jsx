import { useState, useEffect, useCallback } from 'react';
import { getEconomyRecords } from '../api/endpoints';
import { useFilters } from '../hooks/useFilters';
import EconomyFilters from '../components/economy/EconomyFilters';
import EconomyTable from '../components/economy/EconomyTable';
import EconomyTotals from '../components/economy/EconomyTotals';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

export default function EconomyPage() {
  const { filters, updateFilter, setPage, resetFilters, cleanParams } = useFilters();
  const [data, setData] = useState({ data: [], totals: null, meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Transparencia Económica | Números Rojos';
    return () => { document.title = 'Números Rojos'; };
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getEconomyRecords(cleanParams())
      .then((res) => setData(res.data))
      .catch(() => setError('No se pudieron cargar los datos. Intentá de nuevo.'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Compromisos económicos</h1>

      <EconomyFilters filters={filters} onFilter={updateFilter} onReset={resetFilters} />

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="card">
          <ErrorMessage message={error} onRetry={fetchData} />
        </div>
      ) : (
        <div className="card">
          <EconomyTable records={data.data} />
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
