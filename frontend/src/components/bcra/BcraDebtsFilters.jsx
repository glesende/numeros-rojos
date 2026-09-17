import FilterBar from '../common/FilterBar';
import { SITUATION_OPTIONS, formatPeriodLabel } from '../../utils/bcra';

const FILTER_KEYS = ['period', 'entity', 'situation', 'under_review', 'legal_proceeding'];

export default function BcraDebtsFilters({ filters, onFilter, onReset, periods, entities }) {
  const activeCount = FILTER_KEYS.filter(
    (key) => filters[key] !== null && filters[key] !== undefined && filters[key] !== ''
  ).length;

  return (
    <FilterBar onReset={onReset} activeCount={activeCount}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Período</label>
        <select
          value={filters.period || ''}
          onChange={(e) => onFilter('period', e.target.value || null)}
          className="input-field"
        >
          <option value="">Todos</option>
          {periods.map((p) => (
            <option key={p} value={p}>{formatPeriodLabel(p)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Entidad</label>
        <select
          value={filters.entity || ''}
          onChange={(e) => onFilter('entity', e.target.value || null)}
          className="input-field"
        >
          <option value="">Todas</option>
          {entities.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Situación</label>
        <select
          value={filters.situation ?? ''}
          onChange={(e) => onFilter('situation', e.target.value === '' ? null : e.target.value)}
          className="input-field"
        >
          <option value="">Todas</option>
          {SITUATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">En revisión</label>
        <select
          value={filters.under_review ?? ''}
          onChange={(e) => onFilter('under_review', e.target.value === '' ? null : e.target.value)}
          className="input-field"
        >
          <option value="">Todas</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Proceso judicial</label>
        <select
          value={filters.legal_proceeding ?? ''}
          onChange={(e) => onFilter('legal_proceeding', e.target.value === '' ? null : e.target.value)}
          className="input-field"
        >
          <option value="">Todas</option>
          <option value="1">Sí</option>
          <option value="0">No</option>
        </select>
      </div>
    </FilterBar>
  );
}
