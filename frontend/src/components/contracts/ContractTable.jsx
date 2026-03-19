import { Link } from 'react-router-dom';
import OfficialBadge from '../OfficialBadge';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function formatSalary(amount, currency) {
  if (!amount) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ContractTable({ contracts }) {
  if (!contracts.length) {
    return <p className="text-gray-500 text-center py-8">No hay contratos.</p>;
  }

  return (
    <>
      {/* Vista en tarjetas para móvil */}
      <div className="block md:hidden space-y-3">
        {contracts.map((c) => {
          const vencido = new Date(c.expiration_date) < new Date();
          const hoy = new Date();
          const vencimiento = new Date(c.expiration_date);
          const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
          const proximoAVencer = !vencido && diasRestantes <= 90;

          return (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link
                  to={`/contratos/${c.id}`}
                  className="text-rojo font-semibold text-sm hover:underline leading-snug"
                >
                  {c.full_name}
                </Link>
                {c.official ? (
                  <OfficialBadge />
                ) : (
                  <span className="text-gray-400 text-xs shrink-0">No oficial</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className={`font-medium ${vencido ? 'text-red-600' : proximoAVencer ? 'text-amber-600' : 'text-gray-700'}`}>
                  Vence: {formatDate(c.expiration_date)}
                  {vencido && <span className="ml-1">(vencido)</span>}
                  {proximoAVencer && <span className="ml-1">(próximo)</span>}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  % Pase: <span className="font-mono font-medium text-gray-700">{c.club_pass_percentage}%</span>
                </span>
                <span className="font-mono font-semibold text-gray-800">
                  {formatSalary(c.estimated_salary, c.currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vista en tabla para desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
              <th className="pb-3 pr-4">Jugador</th>
              <th className="pb-3 pr-4">Vencimiento</th>
              <th className="pb-3 pr-4 text-right">% Pase</th>
              <th className="pb-3 pr-4 text-right">Salario est.</th>
              <th className="pb-3">Oficial</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => {
              const vencido = new Date(c.expiration_date) < new Date();
              return (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium">
                    <Link to={`/contratos/${c.id}`} className="text-rojo hover:underline">
                      {c.full_name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className={vencido ? 'text-red-600' : ''}>{formatDate(c.expiration_date)}</span>
                    {vencido && <span className="ml-1 text-xs text-red-500">(vencido)</span>}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">{c.club_pass_percentage}%</td>
                  <td className="py-3 pr-4 text-right font-mono whitespace-nowrap">
                    {formatSalary(c.estimated_salary, c.currency)}
                  </td>
                  <td className="py-3">
                    {c.official ? (
                      <OfficialBadge />
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
