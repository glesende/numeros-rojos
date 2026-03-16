import { useState, useEffect, useMemo, useCallback } from 'react';
import { getContracts } from '../api/endpoints';
import Loader from '../components/common/Loader';
import MonthlyBarChart from '../components/economy/MonthlyBarChart';

const VIGENCIA_OPTIONS = [
  { value: '6m', label: 'Vence en 6 meses', days: 180 },
  { value: '12m', label: 'Vence en 12 meses', days: 365 },
  { value: '18m', label: 'Vence en 18 meses', days: 540 },
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
  const days = getDaysUntil(contract.expiration_date);
  const expired = days < 0;
  const soon = days >= 0 && days <= 60;

  return (
    <div
      className="flex-shrink-0 w-60 snap-start card p-4 hover:shadow-md hover:border-rojo/20 transition-all duration-200 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        {contract.player_avatar ? (
          <img
            src={contract.player_avatar}
            alt={contract.full_name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-rojo text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            {contract.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="overflow-hidden flex-1">
          <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
            {contract.full_name}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 text-sm flex-1">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">Vence</span>
          <span className={`font-mono text-xs ${expired ? 'text-red-600' : soon ? 'text-yellow-600' : 'text-gray-700'}`}>
            {formatDate(contract.expiration_date)}
          </span>
        </div>
        {contract.club_pass_percentage !== null && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">% Pase</span>
            <span className="font-mono text-xs">{contract.club_pass_percentage}%</span>
          </div>
        )}
        {contract.estimated_salary && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Salario est.</span>
            <span className="font-mono text-xs">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: contract.currency || 'USD',
                maximumFractionDigits: 0,
              }).format(contract.estimated_salary)}
            </span>
          </div>
        )}
      </div>

      {Array.isArray(contract.links) && contract.links.length > 0 && (
        <div className="pt-1 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">
            Fuentes {contract.official && <span className="text-green-600 font-semibold">Oficial</span>}
          </p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {contract.links.slice(0, 2).map((link, i) => {
              let label = link;
              try {
                const url = new URL(link);
                label = url.hostname.replace('www.', '');
              } catch {}
              return (
                <li key={i}>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="text-rojo hover:underline truncate block">
                    {label}
                  </a>
                </li>
              );
            })}
            {contract.links.length > 2 && (
              <li className="text-gray-400">+{contract.links.length - 2} más</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [vigencia, setVigencia] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchContracts = useCallback(() => {
    setLoading(true);
    getContracts({ per_page: 100, sort_dir: 'asc' })
      .then((res) => {
        setContracts(res.data.data || []);
      })
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = 'Números Rojos | Portal de transparencia de Independiente';
    return () => { document.title = 'Números Rojos'; };
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const filteredContracts = useMemo(() => {
    let result = contracts;

    if (searchInput.trim()) {
      const query = searchInput.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(query) ||
          c.club_name?.toLowerCase().includes(query)
      );
    }

    if (vigencia) {
      const option = VIGENCIA_OPTIONS.find((o) => o.value === vigencia);
      if (option) {
        result = result.filter((c) => {
          const days = getDaysUntil(c.expiration_date);
          return days >= 0 && days <= option.days;
        });
      }
    }

    return result;
  }, [contracts, searchInput, vigencia]);

  const handleVigenciaClick = (value) => {
    setVigencia(vigencia === value ? '' : value);
  };

  const handleClear = () => {
    setSearchInput('');
    setVigencia('');
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
        </div>

        {/* Search bar */}
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar jugador..."
            className="input-field flex-1"
          />
        </form>

        {/* Vigencia buttons */}
        <div className="flex gap-2 flex-wrap mb-6">
          {VIGENCIA_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleVigenciaClick(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                vigencia === opt.value
                  ? 'bg-rojo text-white border-rojo'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-rojo/40 hover:text-rojo'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {(vigencia || searchInput) && (
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
        ) : filteredContracts.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            No se encontraron contratos con los filtros seleccionados.
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">{filteredContracts.length} contratos encontrados</p>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {filteredContracts.map((c) => (
                <ContractCard key={c.id} contract={c} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
