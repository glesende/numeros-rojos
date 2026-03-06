import { useState, useEffect } from 'react';
import { getContracts } from '../api/endpoints';
import { useFilters } from '../hooks/useFilters';
import ContractFilters from '../components/contracts/ContractFilters';
import ContractTable from '../components/contracts/ContractTable';
import ContractTotals from '../components/contracts/ContractTotals';
import Pagination from '../components/common/Pagination';
import Loader from '../components/common/Loader';

export default function ContractsPage() {
  const { filters, updateFilter, setPage, resetFilters, cleanParams } = useFilters();
  const [data, setData] = useState({ data: [], totals: null, meta: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getContracts(cleanParams())
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Transparencia Contractual</h1>
      <p className="text-gray-500 text-sm mb-6">
        Contratos del plantel profesional del Club Atletico Independiente.
      </p>

      <ContractTotals totals={data.totals} />
      <ContractFilters filters={filters} onFilter={updateFilter} onReset={resetFilters} />

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <ContractTable contracts={data.data} />
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
