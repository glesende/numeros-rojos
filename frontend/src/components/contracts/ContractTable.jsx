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

function getHostname(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function SourcesList({ links }) {
  if (!links?.length) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {links.slice(0, 2).map((link, i) => (
        <div key={i} className="flex items-center gap-1">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rojo hover:underline text-xs truncate max-w-[110px]"
          >
            {getHostname(link.url)}
          </a>
          {link.official && <OfficialBadge />}
        </div>
      ))}
      {links.length > 2 && (
        <span className="text-xs text-gray-400">+{links.length - 2} más</span>
      )}
    </div>
  );
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
          const effectiveEnd = c.termination_date || c.expiration_date;
          const vencido = new Date(effectiveEnd) < new Date();
          const hoy = new Date();
          const vencimiento = new Date(effectiveEnd);
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
                {c.loan && (
                  <span className="text-xs font-semibold text-blue-600 shrink-0">Préstamo</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className={`font-medium ${vencido ? 'text-red-600' : proximoAVencer ? 'text-amber-600' : 'text-gray-700'}`}>
                  {c.termination_date ? 'Rescindido' : 'Vence'}: {formatDate(effectiveEnd)}
                  {vencido && <span className="ml-1">(vencido)</span>}
                  {proximoAVencer && <span className="ml-1">(próximo)</span>}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-500">
                  % Pase: <span className="font-mono font-medium text-gray-700">{c.club_pass_percentage}%</span>
                </span>
                <span className="font-mono font-semibold text-gray-800">
                  {formatSalary(c.estimated_salary, c.currency)}
                </span>
              </div>

              {c.links?.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <SourcesList links={c.links} />
                </div>
              )}
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
              <th className="pb-3">Fuentes</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => {
              const effectiveEnd = c.termination_date || c.expiration_date;
              const vencido = new Date(effectiveEnd) < new Date();
              return (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium">
                    <div className="flex items-center gap-2">
                      <Link to={`/contratos/${c.id}`} className="text-rojo hover:underline">
                        {c.full_name}
                      </Link>
                      {c.loan && (
                        <span className="text-xs font-semibold text-blue-600">Préstamo</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className={vencido ? 'text-red-600' : ''}>
                      {c.termination_date ? (
                        <span className="text-red-600">Rescindido: {formatDate(c.termination_date)}</span>
                      ) : (
                        formatDate(c.expiration_date)
                      )}
                    </span>
                    {vencido && !c.termination_date && (
                      <span className="ml-1 text-xs text-red-500">(vencido)</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">{c.club_pass_percentage}%</td>
                  <td className="py-3 pr-4 text-right font-mono whitespace-nowrap">
                    {formatSalary(c.estimated_salary, c.currency)}
                  </td>
                  <td className="py-3">
                    <SourcesList links={c.links} />
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
