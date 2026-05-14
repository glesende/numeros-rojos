import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRumors, deleteRumor } from '../api/endpoints';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import SectionEnableToggle from '../components/admin/SectionEnableToggle';

export default function AdminRumorsPage() {
  const [data, setData] = useState({ data: [], meta: null });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    const params = { page, per_page: 20 };
    if (search) params.search = search;
    getRumors(params)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, [page, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminar este rumor?')) return;
    await deleteRumor(id);
    fetchData();
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <SectionEnableToggle settingKey="section_rumores_enabled" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="text-rojo text-sm hover:underline">&larr; Admin</Link>
          <h1 className="text-2xl font-extrabold">Rumores del mercado</h1>
        </div>
        <button onClick={() => navigate('/admin/rumores/nuevo')} className="btn-primary text-sm">
          + Nuevo rumor
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Buscar por nombre de jugador..."
          className="input-field w-full max-w-sm"
        />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-gray-500 uppercase">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Jugador</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-400">{r.id}</td>
                  <td className="py-2 pr-4 font-medium">{r.full_name}</td>
                  <td className="py-2 pr-4">
                    {r.status === 'contratado'
                      ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Contratado</span>
                      : <span className="text-xs text-gray-400">Rumor</span>
                    }
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/admin/rumores/${r.id}/editar`)}
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
