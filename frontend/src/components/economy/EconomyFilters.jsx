import FilterBar from '../common/FilterBar';

export default function EconomyFilters({ filters, onFilter, onReset }) {
  return (
    <FilterBar onReset={onReset}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
        <select
          value={filters.tipo || ''}
          onChange={(e) => onFilter('tipo', e.target.value || null)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="cobro">Cobro</option>
          <option value="pago">Pago</option>
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
        <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
        <input
          type="date"
          value={filters.fecha_desde || ''}
          onChange={(e) => onFilter('fecha_desde', e.target.value || null)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
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
