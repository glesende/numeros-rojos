import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEconomyRecord } from '../api/endpoints';
import Loader from '../components/common/Loader';
import OfficialBadge from '../components/OfficialBadge';
import SourceLabel from '../components/SourceLabel';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export default function EconomyDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEconomyRecord(id)
      .then((res) => {
        const r = res.data.data;
        setRecord(r);
        if (r) document.title = `${r.description} | Números Rojos`;
      })
      .finally(() => setLoading(false));
    return () => { document.title = 'Números Rojos'; };
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
          <span className={record.type === 'cobro' ? 'badge-cobro' : 'badge-pago'}>
            {record.type}
          </span>
          {record.links?.some((l) => l.official) && <OfficialBadge />}
          {record.carried_out && <span className="text-xs font-semibold text-ingreso">Efectuado</span>}
        </div>

        <h1 className="text-xl font-bold mb-4">{record.description}</h1>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Monto</p>
            <p className="font-mono font-bold text-lg">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: record.currency,
                maximumFractionDigits: 0,
              }).format(record.amount)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Fecha</p>
            <p className="font-medium">{formatDate(record.record_date) || 'Sin fecha'}</p>
          </div>
        </div>

        {record.entity && (
          <div className="mt-4">
            <p className="text-gray-500 text-sm">Entidad</p>
            <p className="font-medium">{record.entity}</p>
          </div>
        )}

        {record.comments && (
          <div className="mt-4">
            <p className="text-gray-500 text-sm">Comentarios</p>
            <p className="text-sm">{record.comments}</p>
          </div>
        )}

        {record.links && record.links.length > 0 && (
          <div className="mt-6">
            <p className="text-gray-500 text-sm mb-2">Fuentes</p>
            <ul className="space-y-1">
              {record.links.map((link, i) => (
                <li key={i} className="flex items-center gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rojo text-sm hover:underline"
                  >
                    <SourceLabel url={link.url} />
                  </a>
                  {link.official && <OfficialBadge />}
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
