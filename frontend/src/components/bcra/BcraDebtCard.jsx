import { formatArsCompact, formatPeriodLabel, formatUsdCompact, translateSituation } from '../../utils/bcra';

export default function BcraDebtCard({ record: r }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs text-gray-500">{formatPeriodLabel(r.period)}</span>
        <div className="text-right font-mono font-semibold text-sm leading-tight">
          <div>{formatArsCompact(r.amount_ars)}</div>
          <div className="text-xs text-gray-400 font-normal">{formatUsdCompact(r.amount_usd)}</div>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-800 mb-2 leading-snug">{r.entity}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span>{translateSituation(r.situation)}</span>
        {r.under_review && <span className="text-amber-600 font-medium">En revisión</span>}
        {r.legal_proceeding && <span className="text-red-600 font-medium">Proceso judicial</span>}
      </div>
    </div>
  );
}
