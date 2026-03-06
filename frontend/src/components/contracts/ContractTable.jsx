import { Link } from 'react-router-dom';
import ConfidenceBadge from '../common/ConfidenceBadge';

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
            <th className="pb-3 pr-4">Confianza</th>
            <th className="pb-3">Oficial</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => {
            const vencido = new Date(c.fecha_caducidad) < new Date();
            return (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium">
                  <Link to={`/contratos/${c.id}`} className="text-rojo hover:underline">
                    {c.nombre_completo}
                  </Link>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">{c.fecha_firma}</td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  <span className={vencido ? 'text-red-600' : ''}>{c.fecha_caducidad}</span>
                  {vencido && <span className="ml-1 text-xs text-red-500">(vencido)</span>}
                </td>
                <td className="py-3 pr-4 text-right font-mono">{c.porcentaje_pase_club}%</td>
                <td className="py-3 pr-4 text-right font-mono whitespace-nowrap">
                  {c.salario_estimado
                    ? new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: c.moneda || 'USD',
                        maximumFractionDigits: 0,
                      }).format(c.salario_estimado)
                    : '-'}
                </td>
                <td className="py-3 pr-4">
                  <ConfidenceBadge level={c.confidence_level} />
                </td>
                <td className="py-3">
                  {c.oficial ? (
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
