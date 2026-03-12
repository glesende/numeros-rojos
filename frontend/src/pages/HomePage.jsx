import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getContracts } from '../api/endpoints';
import Loader from '../components/common/Loader';
import MonthlyBarChart from '../components/economy/MonthlyBarChart';

const VIGENCIA_OPTIONS = [
  { value: '6m', label: 'Vence en 6 meses' },
  { value: '12m', label: 'Vence en 12 meses' },
  { value: '18m', label: 'Vence en 18 meses' },
];

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

function ContractCard({ contract }) {
  const days = getDaysUntil(contract.fecha_caducidad);
  const expired = days < 0;
  const soon = days >= 0 && days <= 60;

  return (
    <Link
      to={`/contratos/${contract.id}`}
      className="flex-shrink-0 w-60 snap-start card p-4 hover:shadow-md hover:border-rojo/20 transition-all duration-200 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rojo text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
          {contract.nombre_completo.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden flex-1">
          <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
            {contract.nombre_completo}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-sm flex-1">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Vence</span>
          <span className={`font-mono text-xs ${expired ? 'text-red-600' : soon ? 'text-yellow-600' : 'text-gray-700'}`}>
            {formatDate(contract.fecha_caducidad)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Estado</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              expired
                ? 'bg-red-100 text-red-700'
                : soon
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {expired ? 'Vencido' : `${days}d restantes`}
          </span>
        </div>
        {contract.porcentaje_pase_club !== null && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">% Pase</span>
            <span className="font-mono text-xs">{contract.porcentaje_pase_club}%</span>
          </div>
        )}
        {contract.salario_estimado && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Salario est.</span>
            <span className="font-mono text-xs">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: contract.moneda || 'USD',
                maximumFractionDigits: 0,
              }).format(contract.salario_estimado)}
            </span>
          </div>
        )}
      </div>

      {contract.oficial && (
        <div className="flex items-center pt-1 border-t border-gray-100">
          <span className="text-xs font-semibold text-green-600">Oficial</span>
        </div>
      )}
    </Link>
  );
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vigencia = searchParams.get('vigencia') || '';
  const buscar = searchParams.get('buscar') || '';

  const [searchInput, setSearchInput] = useState(buscar);
  const [contracts, setContracts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Números Rojos | Portal de transparencia de Independiente';
    return () => { document.title = 'Números Rojos'; };
  }, []);

  const fetchContracts = useCallback(() => {
    setLoading(true);
    const params = { per_page: 100, sort_dir: 'asc' };
    if (vigencia) params.vigencia = vigencia;
    if (buscar) params.buscar = buscar;

    getContracts(params)
      .then((res) => {
        setContracts(res.data.data || []);
        setTotal(res.data.meta?.total || 0);
      })
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, [vigencia, buscar]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const setVigencia = (value) => {
    const params = {};
    if (value && value !== vigencia) params.vigencia = value;
    if (buscar) params.buscar = buscar;
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (vigencia) params.vigencia = vigencia;
    if (searchInput.trim()) params.buscar = searchInput.trim();
    setSearchParams(params);
  };

  const handleClear = () => {
    setSearchInput('');
    setSearchParams({});
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-rojo text-white py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight">
            Los datos que todo socio de<br />Independiente tiene que saber
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            Centralizados, simples y concretos.
          </p>
        </div>
      </section>

      {/* Monthly income/expense chart */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <MonthlyBarChart />
      </section>

      {/* Contracts carousel */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Contratos del plantel</h2>
          <Link to="/contratos" className="text-sm text-rojo hover:underline font-medium">
            Ver tabla completa →
          </Link>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar jugador..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Buscar
          </button>
        </form>

        {/* Vigencia buttons */}
        <div className="flex gap-2 flex-wrap mb-6">
          {VIGENCIA_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setVigencia(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                vigencia === opt.value
                  ? 'bg-rojo text-white border-rojo'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-rojo/40 hover:text-rojo'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {(vigencia || buscar) && (
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 border border-transparent transition-all"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12">
            <Loader />
          </div>
        ) : contracts.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            No se encontraron contratos con los filtros seleccionados.
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">{total} contratos encontrados</p>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {contracts.map((c) => (
                <ContractCard key={c.id} contract={c} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
