import { useEffect, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBcraDebts, getBcraDebtRecords } from '../api/endpoints';
import { useFilters } from '../hooks/useFilters';
import { useInfiniteList } from '../hooks/useInfiniteList';
import { usePageMeta } from '../hooks/usePageMeta';
import BcraDebtsFilters from '../components/bcra/BcraDebtsFilters';
import BcraDebtsTable from '../components/bcra/BcraDebtsTable';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

const FILTER_KEYS = ['period', 'entity', 'situation', 'under_review', 'legal_proceeding'];
const ALLOWED_SORT_FIELDS = ['period', 'entity', 'amount', 'situation'];

export default function BcraDebtsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [periods, setPeriods] = useState([]);
  const [entities, setEntities] = useState([]);

  const initialFilters = {};
  FILTER_KEYS.forEach((key) => {
    const val = searchParams.get(key);
    if (val !== null && val !== '') initialFilters[key] = val;
  });

  const initialSortBy = ALLOWED_SORT_FIELDS.includes(searchParams.get('sort_by'))
    ? searchParams.get('sort_by')
    : 'period';
  const initialSortDir = searchParams.get('sort_dir') === 'asc' ? 'asc' : 'desc';

  const { filters, updateFilter, resetFilters, cleanParams } = useFilters({
    ...initialFilters,
    sort_by: initialSortBy,
    sort_dir: initialSortDir,
  });

  usePageMeta({
    title: 'Deudas bancarias de Independiente | Números Rojos',
    description: 'Historial completo de la deuda bancaria del Club Atlético Independiente ante el sistema financiero, según la Central de Deudores del BCRA.',
    path: '/deudas-bancarias',
  });

  // Periods/entities for the filter dropdowns come from the same aggregate endpoint the chart uses.
  useEffect(() => {
    getBcraDebts()
      .then((res) => {
        setPeriods((res.data?.data || []).map((d) => d.period).reverse());
        setEntities(res.data?.entities || []);
      })
      .catch(() => {});
  }, []);

  // Sync all filters and sort state to URL for shareability
  useEffect(() => {
    const params = {};
    if (filters.sort_by && filters.sort_by !== 'period') params.sort_by = filters.sort_by;
    if (filters.sort_dir && filters.sort_dir !== 'desc') params.sort_dir = filters.sort_dir;
    FILTER_KEYS.forEach((key) => {
      const val = filters[key];
      if (val !== null && val !== undefined && val !== '') params[key] = val;
    });
    setSearchParams(params, { replace: true });
  }, [filters.sort_by, filters.sort_dir, filters.period, filters.entity, filters.situation, filters.under_review, filters.legal_proceeding]);

  const handleSort = useCallback((field) => {
    if (filters.sort_by === field) {
      updateFilter('sort_dir', filters.sort_dir === 'desc' ? 'asc' : 'desc');
    } else {
      updateFilter('sort_by', field);
      updateFilter('sort_dir', 'desc');
    }
  }, [filters.sort_by, filters.sort_dir, updateFilter]);

  const { page: _page, per_page: _perPage, ...queryParams } = cleanParams();
  const { items, loading, loadingMore, hasMore, error, sentinelRef, retry } =
    useInfiniteList(getBcraDebtRecords, queryParams, { perPage: 20 });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Deudas bancarias</h1>
      <p className="text-xs text-gray-400 mb-4">
        Fuente: Central de Deudores del BCRA · Montos dolarizados con la cotización de cada período
      </p>

      <BcraDebtsFilters
        filters={filters}
        onFilter={updateFilter}
        onReset={resetFilters}
        periods={periods}
        entities={entities}
      />

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="card">
          <ErrorMessage message={error} onRetry={retry} />
        </div>
      ) : (
        <div className="card">
          <BcraDebtsTable
            records={items}
            sortBy={filters.sort_by}
            sortDir={filters.sort_dir}
            onSort={handleSort}
          />
          {hasMore && <div ref={sentinelRef} className="h-1" />}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <Loader />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
