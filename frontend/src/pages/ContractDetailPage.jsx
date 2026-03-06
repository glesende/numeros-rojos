import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContract } from '../api/endpoints';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import Loader from '../components/common/Loader';

export default function ContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContract(id)
      .then((res) => setContract(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!contract) return <p className="text-center py-12 text-gray-500">No encontrado.</p>;

  const vencido = new Date(contract.fecha_caducidad) < new Date();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/contratos" className="text-rojo text-sm hover:underline mb-4 inline-block">
        &larr; Volver a contratos
      </Link>

      <div className="card">
        <div className="flex items-center gap-3 mb-2">
          <ConfidenceBadge level={contract.confidence_level} />
          {contract.oficial && <span className="text-xs font-semibold text-green-600">Oficial</span>}
          {vencido && <span className="text-xs font-semibold text-red-600">Vencido</span>}
        </div>

        <h1 className="text-xl font-bold mb-6">{contract.nombre_completo}</h1>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-gray-500">Fecha de firma</p>
            <p className="font-medium">{contract.fecha_firma}</p>
          </div>
          <div>
            <p className="text-gray-500">Fecha de vencimiento</p>
            <p className={`font-medium ${vencido ? 'text-red-600' : ''}`}>{contract.fecha_caducidad}</p>
          </div>
          <div>
            <p className="text-gray-500">Porcentaje del pase</p>
            <p className="font-mono font-bold text-lg">{contract.porcentaje_pase_club}%</p>
          </div>
          <div>
            <p className="text-gray-500">Salario estimado</p>
            <p className="font-mono font-bold text-lg">
              {contract.salario_estimado
                ? new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: contract.moneda || 'USD',
                    maximumFractionDigits: 0,
                  }).format(contract.salario_estimado)
                : 'No disponible'}
            </p>
          </div>
        </div>

        {contract.clausulas && contract.clausulas.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-500 text-sm mb-2">Clausulas</p>
            <ul className="space-y-1">
              {contract.clausulas.map((c, i) => (
                <li key={i} className="text-sm bg-gray-50 px-3 py-2 rounded">{c}</li>
              ))}
            </ul>
          </div>
        )}

        {contract.links && contract.links.length > 0 && (
          <div>
            <p className="text-gray-500 text-sm mb-2">Fuentes</p>
            <ul className="space-y-1">
              {contract.links.map((link, i) => (
                <li key={i}>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-rojo text-sm hover:underline break-all">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">Actualizado: {contract.updated_at}</p>
      </div>
    </div>
  );
}
