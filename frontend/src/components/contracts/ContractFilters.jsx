import FilterBar from '../common/FilterBar';

export default function ContractFilters({ filters, onFilter, onReset }) {
  return (
    <FilterBar onReset={onReset}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Vigencia</label>
        <select
          value={filters.vigencia ?? ''}
          onChange={(e) => onFilter('vigencia', e.target.value === '' ? null : e.target.value)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="6m">Vence en 6 meses</option>
          <option value="12m">Vence en 12 meses</option>
          <option value="18m">Vence en 18 meses</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Oficial</label>
        <select
          value={filters.oficial ?? ''}
          onChange={(e) => onFilter('oficial', e.target.value === '' ? null : e.target.value)}
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
          value={filters.fecha_desde || ''}
          onChange={(e) => onFilter('fecha_desde', e.target.value || null)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Firma hasta</label>
        <input
          type="date"
          value={filters.fecha_hasta || ''}
          onChange={(e) => onFilter('fecha_hasta', e.target.value || null)}
          className="input-field"
        />
      </div>
    </FilterBar>
  );
}
