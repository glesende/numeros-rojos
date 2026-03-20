import FilterBar from '../common/FilterBar';

const START_YEAR = 2022;

function getYears() {
  const current = new Date().getFullYear();
  const years = [];
  for (let y = START_YEAR; y <= current; y++) years.push(y);
  return years;
}

function getSelectedYear(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return null;
  const from = new Date(dateFrom + 'T00:00:00');
  const to = new Date(dateTo + 'T00:00:00');
  const year = from.getFullYear();
  if (
    from.getMonth() === 0 && from.getDate() === 1 &&
    to.getMonth() === 11 && to.getDate() === 31 &&
    to.getFullYear() === year
  ) {
    return year;
  }
  return null;
}

export default function EconomyFilters({ filters, onFilter, onReset }) {
  const years = getYears();
  const selectedYear = getSelectedYear(filters.date_from, filters.date_to);
  const noDateFilter = !filters.date_from && !filters.date_to;

  function selectYear(year) {
    onFilter('date_from', `${year}-01-01`);
    onFilter('date_to', `${year}-12-31`);
  }

  function clearYearFilter() {
    onFilter('date_from', null);
    onFilter('date_to', null);
  }

  return (
    <FilterBar onReset={onReset}>
      <div className="w-full flex flex-wrap items-center gap-2 pb-1">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => selectYear(year)}
            className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-rojo focus:ring-offset-1 ${
              selectedYear === year
                ? 'bg-rojo text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {year}
          </button>
        ))}
        <button
          onClick={clearYearFilter}
          className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 ${
            noDateFilter
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilter('search', e.target.value || null)}
          placeholder="Descripcion o entidad"
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
