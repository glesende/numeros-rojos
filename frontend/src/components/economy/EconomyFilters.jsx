import FilterBar from '../common/FilterBar';

export default function EconomyFilters({ filters, onFilter, onReset }) {
  return (
    <FilterBar onReset={onReset}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilter('search', e.target.value || null)}
          placeholder="Descripción o entidad"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
        <select
          value={filters.type || ''}
          onChange={(e) => onFilter('type', e.target.value || null)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="cobro">Cobro</option>
          <option value="pago">Pago</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Moneda</label>
        <select
          value={filters.currency || ''}
          onChange={(e) => onFilter('currency', e.target.value || null)}
          className="input-field"
        >
          <option value="">Todas</option>
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Efectuado</label>
        <select
          value={filters.carried_out ?? ''}
          onChange={(e) => onFilter('carried_out', e.target.value === '' ? null : e.target.value)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="1">Efectuado</option>
          <option value="0">No efectuado</option>
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
        <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
        <input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) => onFilter('date_from', e.target.value || null)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
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
