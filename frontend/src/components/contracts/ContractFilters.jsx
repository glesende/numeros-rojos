import FilterBar from '../common/FilterBar';

export default function ContractFilters({ filters, onFilter, onReset }) {
  return (
    <FilterBar onReset={onReset}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar jugador</label>
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilter('search', e.target.value || null)}
          placeholder="Nombre del jugador"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
        <select
          value={filters.status || ''}
          onChange={(e) => onFilter('status', e.target.value || null)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="vigente">Vigente</option>
          <option value="vencido">Terminado</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Vigencia</label>
        <select
          value={filters.validity || ''}
          onChange={(e) => onFilter('validity', e.target.value || null)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="6m">Próximos 6 meses</option>
          <option value="12m">Próximos 12 meses</option>
          <option value="18m">Próximos 18 meses</option>
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
        <label className="block text-xs font-medium text-gray-500 mb-1">Préstamo</label>
        <select
          value={filters.loan ?? ''}
          onChange={(e) => onFilter('loan', e.target.value === '' ? null : e.target.value)}
          className="input-field"
        >
          <option value="">Todos</option>
          <option value="1">A préstamo</option>
          <option value="0">Sin préstamo</option>
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
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Vence desde</label>
        <input
          type="date"
          value={filters.expire_from || ''}
          onChange={(e) => onFilter('expire_from', e.target.value || null)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Vence hasta</label>
        <input
          type="date"
          value={filters.expire_to || ''}
          onChange={(e) => onFilter('expire_to', e.target.value || null)}
          className="input-field"
        />
      </div>
    </FilterBar>
  );
}
