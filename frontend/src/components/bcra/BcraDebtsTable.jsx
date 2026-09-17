import BcraDebtCard from './BcraDebtCard';
import { formatArsCompact, formatPeriodLabel, formatUsdCompact, translateSituation } from '../../utils/bcra';

function SortIcon({ active, dir }) {
  if (!active) return <span className="ml-1 text-gray-300">↕</span>;
  return <span className="ml-1 text-rojo">{dir === 'asc' ? '↑' : '↓'}</span>;
}

function SortableHeader({ label, field, sortBy, sortDir, onSort, className = '' }) {
  const active = sortBy === field;
  return (
    <th className={`pb-3 pr-4 ${className}`}>
      <button
        onClick={() => onSort(field)}
        className={`flex items-center gap-0 uppercase text-xs font-semibold tracking-wide transition-colors ${
          active ? 'text-rojo' : 'text-gray-500 hover:text-gray-800'
        } ${className.includes('text-right') ? 'ml-auto' : ''}`}
      >
        {label}
        <SortIcon active={active} dir={sortDir} />
      </button>
    </th>
  );
}

export default function BcraDebtsTable({ records, sortBy, sortDir, onSort }) {
  if (!records.length) {
    return <p className="text-gray-500 text-center py-8">No hay registros.</p>;
  }

  return (
    <>
      {/* Vista en tarjetas para móvil */}
      <div className="block md:hidden space-y-3">
        {records.map((r, i) => (
          <BcraDebtCard key={`${r.period}-${r.entity}-${i}`} record={r} />
        ))}
      </div>

      {/* Vista en tabla para desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
              <SortableHeader label="Período" field="period" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableHeader label="Entidad" field="entity" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortableHeader label="Deuda" field="amount" sortBy={sortBy} sortDir={sortDir} onSort={onSort} className="text-right" />
              <SortableHeader label="Situación" field="situation" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="pb-3 pr-4">En revisión</th>
              <th className="pb-3">Proceso judicial</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={`${r.period}-${r.entity}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 whitespace-nowrap">{formatPeriodLabel(r.period)}</td>
                <td className="py-3 pr-4">{r.entity}</td>
                <td className="py-3 pr-4 text-right font-mono whitespace-nowrap leading-tight">
                  <div>{formatArsCompact(r.amount_ars)}</div>
                  <div className="text-xs text-gray-400">{formatUsdCompact(r.amount_usd)}</div>
                </td>
                <td className="py-3 pr-4">{translateSituation(r.situation)}</td>
                <td className="py-3 pr-4">{r.under_review ? 'Sí' : 'No'}</td>
                <td className="py-3">{r.legal_proceeding ? 'Sí' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
