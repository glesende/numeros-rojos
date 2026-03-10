import { Link } from 'react-router-dom';
import ConfidenceBadge from '../common/ConfidenceBadge';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function formatMoney(amount, currency) {
  const fmt = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    maximumFractionDigits: 0,
  });
  return fmt.format(amount);
}

export default function EconomyTable({ records }) {
  if (!records.length) {
    return <p className="text-gray-500 text-center py-8">No hay registros.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
            <th className="pb-3 pr-4">Fecha</th>
            <th className="pb-3 pr-4">Descripcion</th>
            <th className="pb-3 pr-4">Tipo</th>
            <th className="pb-3 pr-4 text-right">Monto</th>
            <th className="pb-3 pr-4">Confianza</th>
            <th className="pb-3">Oficial</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 pr-4 whitespace-nowrap">{formatDate(r.fecha)}</td>
              <td className="py-3 pr-4">
                <Link to={`/economia/${r.id}`} className="text-rojo hover:underline font-medium">
                  {r.descripcion
                    ? (r.descripcion.length > 60 ? r.descripcion.slice(0, 60) + '...' : r.descripcion)
                    : '-'}
                </Link>
              </td>
              <td className="py-3 pr-4">
                <span className={r.tipo === 'cobro' ? 'badge-cobro' : 'badge-pago'}>
                  {r.tipo}
                </span>
              </td>
              <td className="py-3 pr-4 text-right font-mono whitespace-nowrap">
                {formatMoney(r.monto, r.moneda)}
              </td>
              <td className="py-3 pr-4">
                <ConfidenceBadge level={r.confidence_level} />
              </td>
              <td className="py-3">
                {r.oficial ? (
                  <span className="text-green-600 text-xs font-semibold">Si</span>
                ) : (
                  <span className="text-gray-400 text-xs">No</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
