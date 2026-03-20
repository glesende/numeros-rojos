import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContract, getContractStats } from '../api/endpoints';
import Loader from '../components/common/Loader';
import OfficialBadge from '../components/OfficialBadge';
import ContractWidgets from '../components/contracts/ContractWidgets';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export default function ContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getContract(id), getContractStats()])
      .then(([contractRes, statsRes]) => {
        const c = contractRes.data.data;
        setContract(c);
        setStats(statsRes.data.data);
        if (c) document.title = `Contrato de ${c.full_name} | Números Rojos`;
      })
      .finally(() => setLoading(false));
    return () => { document.title = 'Números Rojos'; };
  }, [id]);

  if (loading) return <Loader />;
  if (!contract) return <p className="text-center py-12 text-gray-500">No encontrado.</p>;

  const effectiveEnd = contract.termination_date || contract.expiration_date;
  const vencido = new Date(effectiveEnd) < new Date();
  const rescindido = !!contract.termination_date;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/contratos" className="text-rojo text-sm hover:underline mb-4 inline-block">
        &larr; Volver a contratos
      </Link>

      <ContractWidgets stats={stats} />

      <div className="card">
        <div className="flex items-center gap-3 mb-2">
          {contract.links?.some((l) => l.official) && <OfficialBadge />}
          {rescindido && <span className="text-xs font-semibold text-red-600">Rescindido</span>}
          {!rescindido && vencido && <span className="text-xs font-semibold text-red-600">Vencido</span>}
        </div>

        <h1 className="text-xl font-bold mb-4">{contract.full_name}</h1>

        {contract.loan && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-blue-800 font-semibold text-sm mb-3">
              Cedido a préstamo en {contract.loan.club}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {contract.loan.until && (
                <div>
                  <p className="text-gray-500 text-xs">Finalización del préstamo</p>
                  <p className="font-medium">{formatDate(contract.loan.until)}</p>
                </div>
              )}
            </div>
            {contract.loan.clauses?.length > 0 && (
              <div className="mt-3">
                <p className="text-gray-500 text-xs mb-1">Cláusulas del préstamo</p>
                <ul className="space-y-1">
                  {contract.loan.clauses.map((clause, i) => (
                    <li key={i} className="text-sm bg-white px-3 py-2 rounded border border-blue-100">{clause}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          {contract.signing_date && (
            <div>
              <p className="text-gray-500">Fecha de firma</p>
              <p className="font-medium">{formatDate(contract.signing_date)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Fecha de vencimiento</p>
            <p className={`font-medium ${!rescindido && vencido ? 'text-red-600' : ''}`}>
              {formatDate(contract.expiration_date)}
            </p>
          </div>
          {rescindido && (
            <div>
              <p className="text-gray-500">Fecha de rescisión</p>
              <p className={`font-medium ${vencido ? 'text-red-600' : 'text-amber-600'}`}>
                {formatDate(contract.termination_date)}
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Porcentaje del pase</p>
            <p className="font-mono font-bold text-lg">{contract.club_pass_percentage}%</p>
          </div>
          <div>
            <p className="text-gray-500">Salario estimado</p>
            <p className="font-mono font-bold text-lg">
              {contract.estimated_salary
                ? new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: contract.currency || 'USD',
                    maximumFractionDigits: 0,
                  }).format(contract.estimated_salary)
                : 'No disponible'}
            </p>
          </div>
        </div>

        {(() => {
          const allClauses = [
            ...(contract.clauses || []),
            ...(contract.loan?.clauses || []),
          ];
          return allClauses.length > 0 ? (
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-2">Clausulas</p>
              <ul className="space-y-1">
                {allClauses.map((c, i) => (
                  <li key={i} className="text-sm bg-gray-50 px-3 py-2 rounded">{c}</li>
                ))}
              </ul>
            </div>
          ) : null;
        })()}

        {contract.links && contract.links.length > 0 && (
          <div>
            <p className="text-gray-500 text-sm mb-2">Fuentes</p>
            <ul className="space-y-1">
              {contract.links.map((link, i) => (
                <li key={i} className="flex items-center gap-2">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-rojo text-sm hover:underline break-all">
                    {link.url}
                  </a>
                  {link.official && <OfficialBadge />}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">Actualizado: {formatDate(contract.updated_at)}</p>
      </div>
    </div>
  );
}
