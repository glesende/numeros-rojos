import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEconomyRecord } from '../api/endpoints';
import ConfidenceBadge from '../components/common/ConfidenceBadge';
import Loader from '../components/common/Loader';

export default function EconomyDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEconomyRecord(id)
      .then((res) => setRecord(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!record) return <p className="text-center py-12 text-gray-500">No encontrado.</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link to="/economia" className="text-rojo text-sm hover:underline mb-4 inline-block">
        &larr; Volver a economia
      </Link>

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${record.tipo === 'cobro' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {record.tipo}
          </span>
          <ConfidenceBadge level={record.confidence_level} />
          {record.oficial && <span className="text-xs font-semibold text-green-600">Oficial</span>}
        </div>

        <h1 className="text-xl font-bold mb-4">{record.descripcion}</h1>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Monto</p>
            <p className="font-mono font-bold text-lg">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: record.moneda,
                maximumFractionDigits: 0,
              }).format(record.monto)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Fecha</p>
            <p className="font-medium">{record.fecha}</p>
          </div>
        </div>

        {record.links && record.links.length > 0 && (
          <div className="mt-6">
            <p className="text-gray-500 text-sm mb-2">Fuentes</p>
            <ul className="space-y-1">
              {record.links.map((link, i) => (
                <li key={i}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rojo text-sm hover:underline break-all"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Actualizado: {record.updated_at}
        </p>
      </div>
    </div>
  );
}
