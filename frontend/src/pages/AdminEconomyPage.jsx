import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getEconomyRecords, deleteEconomyRecord } from '../api/endpoints';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';

export default function AdminEconomyPage() {
  const [data, setData] = useState({ data: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    getEconomyRecords({ page, per_page: 20 })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este registro?')) return;
    await deleteEconomyRecord(id);
    fetchData();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="text-rojo text-sm hover:underline">&larr; Admin</Link>
          <h1 className="text-2xl font-extrabold">Economia</h1>
        </div>
        <button onClick={() => navigate('/admin/economia/nuevo')} className="btn-primary text-sm">
          + Nuevo registro
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Fecha</th>
                <th className="pb-3 pr-4">Descripcion</th>
                <th className="pb-3 pr-4">Tipo</th>
                <th className="pb-3 pr-4 text-right">Monto</th>
                <th className="pb-3 pr-4">Efectuado</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-400">{r.id}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{r.fecha}</td>
                  <td className="py-2 pr-4">
                    {r.descripcion.length > 50 ? r.descripcion.slice(0, 50) + '...' : r.descripcion}
                  </td>
                  <td className="py-2 pr-4 uppercase text-xs font-semibold">{r.tipo}</td>
                  <td className="py-2 pr-4 text-right font-mono">
                    {r.moneda} {Number(r.monto).toLocaleString('es-AR')}
                  </td>
                  <td className="py-2 pr-4">
                    {r.efectuado ? (
                      <span className="text-green-600 text-xs font-semibold">Si</span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/admin/economia/${r.id}/editar`)}
                      className="text-blue-600 text-xs mr-3 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-red-600 text-xs hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
