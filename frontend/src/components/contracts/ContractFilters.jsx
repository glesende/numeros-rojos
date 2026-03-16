import FilterBar from '../common/FilterBar';

export default function ContractFilters({ filters, onFilter, onReset }) {
  return (
    <FilterBar onReset={onReset}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Vigencia</label>
        <select
          value={filters.validity ?? ''}
          onChange={(e) => onFilter('validity', e.target.value === '' ? null : e.target.value)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="6m">Vencen en 6 meses</option>
          <option value="12m">Vencen en 12 meses</option>
          <option value="18m">Vencen en 18 meses</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Oficial</label>
        <select
          value={filters.official ?? ''}
          onChange={(e) => onFilter('official', e.target.value === '' ? null : e.target.value)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="1">Oficial</option>
          <option value="0">No oficial</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Firma desde</label>
        <input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => onFilter('date_from', e.target.value || null)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Firma hasta</label>
        <input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) => onFilter('date_to', e.target.value || null)}
          className="input-field"
        />
      </div>
    </FilterBar>
  );
}
