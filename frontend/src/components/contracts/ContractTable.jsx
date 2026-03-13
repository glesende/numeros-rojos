import { Link } from 'react-router-dom';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export default function ContractTable({ contracts }) {
  if (!contracts.length) {
    return <p className="text-gray-500 text-center py-8">No hay contratos.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
            <th className="pb-3 pr-4">Jugador</th>
            <th className="pb-3 pr-4">Firma</th>
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
                <td className="py-3 pr-4 whitespace-nowrap">{formatDate(c.signing_date)}</td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <span className={vencido ? 'text-red-600' : ''}>{formatDate(c.expiration_date)}</span>
                  {vencido && <span className="ml-1 text-xs text-red-500">(vencido)</span>}
                </td>
                <td className="py-3 pr-4 text-right font-mono">{c.club_pass_percentage}%</td>
                <td className="py-3 pr-4 text-right font-mono whitespace-nowrap">
                  {c.estimated_salary
                    ? new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: c.currency || 'USD',
                        maximumFractionDigits: 0,
                      }).format(c.estimated_salary)
                    : '-'}
                </td>
                <td className="py-3">
                  {c.official ? (
                    <span className="text-green-600 text-xs font-semibold">Si</span>
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
  );
}
