import { useState, useEffect, useCallback } from 'react';
import { getContracts } from '../api/endpoints';
import { useFilters } from '../hooks/useFilters';
import ContractFilters from '../components/contracts/ContractFilters';
import ContractTable from '../components/contracts/ContractTable';
import ContractWidgets from '../components/contracts/ContractWidgets';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

export default function ContractsPage() {
  const { filters, updateFilter, setPage, resetFilters, cleanParams } = useFilters();
  const [data, setData] = useState({ data: [], totals: null, meta: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Transparencia Contractual | Números Rojos';
    return () => { document.title = 'Números Rojos'; };
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getContracts(cleanParams())
      .then((res) => setData(res.data))
      .catch(() => setError('No se pudieron cargar los datos. Intentá de nuevo.'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lastUpdated = data.totals?.last_updated_at
    ? new Date(data.totals.last_updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Contratos profesionales</h1>
      {lastUpdated && (
        <p className="text-xs text-gray-400 mb-4">Última actualización: {lastUpdated}</p>
      )}

      <ContractWidgets stats={data.totals} />

      <ContractFilters filters={filters} onFilter={updateFilter} onReset={resetFilters} />

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="card">
          <ErrorMessage message={error} onRetry={fetchData} />
        </div>
      ) : (
        <div className="card">
          <ContractTable contracts={data.data} />
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
