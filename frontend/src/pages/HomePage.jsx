import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, getRights, getRumors, getStadium, sendContact } from '../api/endpoints';
import { usePageMeta } from '../hooks/usePageMeta';
import PlayerMatchesModal from '../components/stats/PlayerMatchesModal';
import Loader from '../components/common/Loader';
import MonthlyBarChart from '../components/economy/MonthlyBarChart';
import BalanceLineChart from '../components/balances/BalanceLineChart';
import StatsWidget from '../components/stats/StatsWidget';
import useSectionSettings from '../hooks/useSectionSettings';
import { translatePosition } from '../utils/positions';
import ContractWidgets from '../components/contracts/ContractWidgets';
import OfficialBadge from '../components/OfficialBadge';
import SourceLabel from '../components/SourceLabel';
import PlayerAvatar from '../components/PlayerAvatar';

const VIGENCIA_OPTIONS = [
  { value: '6m', label: '6 meses', days: 180 },
  { value: '12m', label: '12 meses', days: 365 },
  { value: '18m', label: '18 meses', days: 540 },
  { value: '24m', label: '24 meses', days: 730 },
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

function ContractCard({ contract, onClick }) {
  const effectiveEnd = contract.termination_date || contract.expiration_date;
  const days = getDaysUntil(effectiveEnd);
  const expired = days < 0;
  const soon = days >= 0 && days <= 60;
  const rescindido = !!contract.termination_date;
  const clickable = !!contract.external_id && !!onClick;

  return (
    <div
      className={`flex-shrink-0 w-60 snap-start card p-4 hover:shadow-md hover:border-rojo/20 transition-all duration-200 flex flex-col gap-3 ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center gap-3">
        <PlayerAvatar src={contract.player_avatar} alt={contract.full_name} />
        <div className="overflow-hidden flex-1">
          <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
            {contract.full_name}
          </p>
          {contract.loan && (
            <span className="text-xs font-semibold text-blue-600">A préstamo en {contract.loan.club}</span>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-sm flex-1">
        {contract.loan?.until && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">A préstamo hasta</span>
            <span className="font-mono text-xs text-blue-600">{formatDate(contract.loan.until)}</span>
          </div>
        )}
        {contract.loan?.clauses?.length > 0 && (
          <div className="flex flex-col gap-0.5">
            {contract.loan.clauses.map((clause, i) => (
              <span key={i} className="text-xs text-blue-500">— {clause}</span>
            ))}
          </div>
        )}
        {contract.signing_date && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Firma</span>
            <span className="font-mono text-xs text-gray-700">{formatDate(contract.signing_date)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-xs">{rescindido ? 'Rescisión' : 'Vence'}</span>
          <span className={`font-mono text-xs ${expired ? 'text-red-600' : soon ? 'text-yellow-600' : 'text-gray-700'}`}>
            {formatDate(effectiveEnd)}
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

      {Array.isArray(contract.clauses) && contract.clauses.length > 0 && (
        <div className="pt-1 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Cláusulas</p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {contract.clauses.slice(0, 2).map((clause, i) => (
              <li key={i} className="bg-gray-50 px-2 py-1 rounded break-words">
                {clause}
              </li>
            ))}
            {contract.clauses.length > 2 && (
              <li className="text-gray-400">+{contract.clauses.length - 2} más</li>
            )}
          </ul>
        </div>
      )}

      {Array.isArray(contract.links) && contract.links.length > 0 && (
        <div className="pt-1 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Fuentes</p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {contract.links.slice(0, 2).map((link, i) => (
              <li key={i} className="flex items-center gap-1">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-rojo hover:underline truncate">
                  <SourceLabel url={link.url} />
                </a>
                {link.official && <OfficialBadge />}
              </li>
            ))}
            {contract.links.length > 2 && (
              <li className="text-gray-400">+{contract.links.length - 2} más</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Unified card for Rights and Rumors — both share the same structure
function PlayerCard({ player, onClick, showPositions = false }) {
  const clickable = !!player.external_id && !!onClick;
  const isArgentine = player.country?.toLowerCase?.()?.includes('argentin');
  const contratado = player.status === 'contratado';
  const positions = showPositions && Array.isArray(player.positions) ? player.positions : [];

  return (
    <div
      className={`flex-shrink-0 w-60 snap-start card p-4 hover:shadow-md hover:border-rojo/20 transition-all duration-200 flex flex-col gap-3 ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <PlayerAvatar src={player.player_avatar} alt={player.full_name} />
          {player.country_flag && !isArgentine && (
            <img
              src={player.country_flag}
              alt=""
              className="absolute -bottom-0.5 -right-0.5 w-4 h-3 object-cover rounded-sm border border-white"
            />
          )}
        </div>
        <div className="overflow-hidden flex-1">
          <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
            {player.full_name}
          </p>
          {player.current_team_name && (
            <p className="text-xs text-gray-500 truncate">{player.current_team_name}</p>
          )}
          {positions.length > 0 && (
            <div className="text-xs text-gray-400 mt-0.5">
              {positions.map((p, i) => (
                <p key={i}>{translatePosition(p.pos)}</p>
              ))}
            </div>
          )}
          {contratado && (
            <span className="inline-block mt-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Contratado
            </span>
          )}
        </div>
      </div>

      {Array.isArray(player.clauses) && player.clauses.length > 0 && (
        <div className="pt-1 border-t border-gray-100 flex-1">
          <p className="text-xs text-gray-400 mb-1">Cláusulas</p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {player.clauses.slice(0, 3).map((clause, i) => (
              <li key={i} className="bg-gray-50 px-2 py-1 rounded break-words">{clause}</li>
            ))}
            {player.clauses.length > 3 && (
              <li className="text-gray-400">+{player.clauses.length - 3} más</li>
            )}
          </ul>
        </div>
      )}

      {Array.isArray(player.links) && player.links.length > 0 && (
        <div className="pt-1 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Fuentes</p>
          <ul className="text-xs text-gray-600 space-y-0.5">
            {player.links.slice(0, 2).map((link, i) => (
              <li key={i} className="flex items-center gap-1">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-rojo hover:underline truncate">
                  <SourceLabel url={link.url} />
                </a>
                {link.official && <OfficialBadge />}
              </li>
            ))}
            {player.links.length > 2 && (
              <li className="text-gray-400">+{player.links.length - 2} más</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function StadiumBlock() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStadium()
      .then((res) => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data?.stadium) return null;

  const { stadium } = data;
  const sectors = stadium.sectors || [];
  const totalCapacity = sectors.reduce((sum, s) => sum + (s.capacity || 0), 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{stadium.name}</h3>
        {totalCapacity > 0 && (
          <span className="text-sm font-mono text-gray-600">
            {totalCapacity.toLocaleString('es-AR')} espectadores
          </span>
        )}
      </div>

      {sectors.length > 0 && (
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500 uppercase">
              <th className="pb-2 pr-4">Sector</th>
              <th className="pb-2 text-right">Capacidad</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s) => (
              <tr key={s.id} className="border-b border-gray-100">
                <td className="py-2 pr-4">{s.name}</td>
                <td className="py-2 text-right font-mono text-gray-700">
                  {s.capacity !== null ? s.capacity.toLocaleString('es-AR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {stadium.link && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Fuente:</span>
          <a href={stadium.link} target="_blank" rel="noopener noreferrer" className="text-rojo hover:underline">
            <SourceLabel url={stadium.link} />
          </a>
          {stadium.link_official ? (
            <OfficialBadge />
          ) : (
            <span className="text-gray-400 italic">No oficial</span>
          )}
        </div>
      )}
    </div>
  );
}

function ContactForm() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // null | 'sending' | 'ok' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await sendContact({ message, email: email || undefined });
      setStatus('ok');
      setMessage('');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-2">
      <p className="text-sm text-gray-500">
        ¿Tenés información, una corrección o un comentario? Envialo acá.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        minLength={10}
        maxLength={2000}
        rows={4}
        placeholder="Tu mensaje..."
        className="w-full text-sm border border-gray-200 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-rojo"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu email (opcional)"
        className="w-full text-sm border border-gray-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-rojo"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {status === 'sending' ? 'Enviando...' : 'Enviar'}
        </button>
        {status === 'ok' && <span className="text-sm text-green-600">¡Mensaje enviado!</span>}
        {status === 'error' && <span className="text-sm text-red-600">No se pudo enviar. Intentá más tarde.</span>}
      </div>
    </form>
  );
}

export default function HomePage() {
  const [vigencia, setVigencia] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [contracts, setContracts] = useState([]);
  const [contractTotals, setContractTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rights, setRights] = useState([]);
  const [rightsLoading, setRightsLoading] = useState(false);
  const [rumors, setRumors] = useState([]);
  const [rumoresLoading, setRumoresLoading] = useState(false);
  const [selectedContractPlayer, setSelectedContractPlayer] = useState(null);
  const [selectedRumorPlayer, setSelectedRumorPlayer] = useState(null);
  const { sections } = useSectionSettings();

  const fetchContracts = useCallback(() => {
    setLoading(true);
    getContracts({ per_page: 100, sort_dir: 'asc' })
      .then((res) => {
        setContracts(res.data.data || []);
        setContractTotals(res.data.totals || null);
      })
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  }, []);

  usePageMeta({
    title: 'Números Rojos - Portal de datos del Club Atlético Independiente',
    description: 'Portal de transparencia económica y deportiva del Club Atlético Independiente. Contratos de jugadores, compromisos económicos, deudas, balances oficiales y estadísticas.',
    path: '/',
  });

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    setRightsLoading(true);
    getRights({ per_page: 100 })
      .then((res) => setRights(res.data.data || []))
      .catch(() => setRights([]))
      .finally(() => setRightsLoading(false));
  }, []);

  useEffect(() => {
    if (sections.section_rumores_enabled !== true) return;
    setRumoresLoading(true);
    getRumors({ per_page: 100 })
      .then((res) => setRumors(res.data.data || []))
      .catch(() => setRumors([]))
      .finally(() => setRumoresLoading(false));
  }, [sections.section_rumores_enabled]);

  const filteredContracts = useMemo(() => {
    let result = contracts;

    result = result.filter((c) => {
      const days = getDaysUntil(c.expiration_date);
      return days > -30;
    });

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
    <>
    <PlayerMatchesModal player={selectedContractPlayer} showContract={true} onClose={() => setSelectedContractPlayer(null)} />
    <PlayerMatchesModal player={selectedRumorPlayer} showContract={false} onClose={() => setSelectedRumorPlayer(null)} />
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

      {/* Rumores del mercado */}
      {sections.section_rumores_enabled === true && (
      <section id="rumores" className="max-w-6xl mx-auto px-4 py-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Rumores del mercado</h2>
          </div>
          <p className="text-sm text-gray-500 -mt-2 mb-4">Las estadísticas de los jugadores mencionados como posibles refuerzos</p>

          {rumoresLoading ? (
            <div className="py-12">
              <Loader />
            </div>
          ) : rumors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay rumores registrados.
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">{rumors.length} jugadores</p>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {rumors.map((r) => (
                  <PlayerCard
                    key={r.id}
                    player={r}
                    showPositions={true}
                    onClick={r.external_id ? () => setSelectedRumorPlayer({ id: r.external_id, nick: r.full_name, image: r.player_avatar }) : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      )}

      {/* Monthly income/expense chart */}
      {sections.section_economia_enabled !== false && (
        <section id="compromisos-economicos" className="max-w-6xl mx-auto px-4 py-4">
          <MonthlyBarChart />
        </section>
      )}

      {/* Contracts carousel */}
      {sections.section_contratos_enabled !== false && (
      <section id="contratos" className="max-w-6xl mx-auto px-4 py-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Contratos del plantel</h2>
            <Link to="/contratos" className="text-sm text-rojo hover:underline font-medium">
              Ver todos →
            </Link>
          </div>

          <ContractWidgets stats={contractTotals} />

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
          <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Vencimiento</p>
          <div className="flex gap-2 flex-wrap">
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
          </div>

          {loading ? (
            <div className="py-12">
              <Loader />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron contratos con los filtros seleccionados.
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">{filteredContracts.length} contratos encontrados</p>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {filteredContracts.map((c) => (
                  <ContractCard
                    key={c.id}
                    contract={c}
                    onClick={c.external_id ? () => setSelectedContractPlayer({ id: c.external_id, nick: c.full_name, image: c.player_avatar }) : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        </section>
      )}

      {/* Derechos carousel */}
      {sections.section_derechos_enabled !== false && (
      <section id="derechos" className="max-w-6xl mx-auto px-4 py-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Derechos sobre jugadores</h2>
          </div>
          <p className="text-sm text-gray-500 -mt-2 mb-4">No incluye derechos de formación</p>

          {rightsLoading ? (
            <div className="py-12">
              <Loader />
            </div>
          ) : rights.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay derechos registrados.
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-3">{rights.length} jugadores</p>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {rights.map((r) => (
                  <PlayerCard
                    key={r.id}
                    player={r}
                    onClick={r.external_id ? () => setSelectedRumorPlayer({ id: r.external_id, nick: r.full_name, image: r.player_avatar }) : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      )}

      {/* Balances */}
      {sections.section_balances_enabled !== false && (
        <section id="balances" className="max-w-6xl mx-auto px-4 py-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Balances oficiales</h2>
              <Link to="/balances" className="text-sm text-rojo hover:underline font-medium">
                Ver todos los balances →
              </Link>
            </div>
            <BalanceLineChart compact={true} showLink={true} />
          </div>
        </section>
      )}

      {/* Stats widget */}
      <section id="estadisticas" className="max-w-6xl mx-auto px-4 py-4">
        <div className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Estadísticas</h2>
              <Link to="/estadisticas" className="text-sm text-rojo hover:underline font-medium">
                Ver todo →
              </Link>
            </div>
            <StatsWidget />
          </div>
      </section>

      {/* Estadio */}
      {sections.section_estadio_enabled !== false && (
        <section id="estadio" className="max-w-6xl mx-auto px-4 py-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Estadio</h2>
            </div>
            <StadiumBlock />
          </div>
        </section>
      )}

      {/* Dato fundamental */}
      <section className="bg-gray-900 py-10 md:py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-10 h-1 bg-rojo mx-auto mb-6 rounded-full"></div>
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-snug mb-5">
            El Club Atlético Independiente es una Asociación Civil. Sus autoridades son elegidas periódicamente por los socios.
          </p>
          <p className="text-sm md:text-base text-gray-400 italic">
            Este es el dato más importante de todos los que persisten en este sitio.
          </p>
          <div className="w-10 h-1 bg-rojo mx-auto mt-6 rounded-full"></div>
        </div>
      </section>

      {/* Methodology */}
      <section id="metodologia" className="max-w-6xl mx-auto px-4 py-4">
        <div className="card overflow-hidden">
        <h2 className="text-xl font-bold mb-4">Metodología y Fuentes</h2>

        <div className="space-y-4">
        <section className="card">
          <p className="text-sm text-gray-600">
            Números Rojos es un proyecto independiente de datos abiertos. No es un sitio
            oficial del Club Atlético Independiente. No genera contenido propio.
            El objetivo es mantener un punto centralizado de datos, recopilando publicaciones
            oficiales y extraoficiales relacionadas con el club.
          </p>
        </section>

        <section className="card">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            Marca Oficial <OfficialBadge className="w-5 h-5" />
          </h3>
          <p className="text-sm text-gray-600">
            Los registros marcados con el ícono <OfficialBadge className="inline-block align-middle w-4 h-4" /> indican que la información fue confirmada
            directamente por el Club Atlético Independiente o proviene de documentos oficiales.
            Los datos que no poseen esa marca tienen como fuente diversas publicaciones periodísticas.
          </p>
        </section>
        
        <section className="card">
          <h3 className="text-lg font-bold mb-3">Fuentes de datos</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <strong>Economía y contratos:</strong> Publicaciones en las redes oficiales del club, 
              Balances y otros documentos oficiales, notas periodísticas de medios especializados
              y/o partidarios.
            </li>
            <li>
              <strong>Estadísticas:</strong> Las estadísticas deportivas son obtenidas de la API de 
              BeSoccer.
            </li>
          </ul>
        </section>

        <section className="card">
          <h3 className="text-lg font-bold mb-3">Actualización</h3>
          <p className="text-sm text-gray-600 mb-4">
            Los datos se actualizan manualmente de forma humana, con la ayuda de agentes de inteligencia artificial.
          </p>
          <ContactForm />
        </section>

        <section className="card border border-rojo/20">
          <h3 className="text-lg font-bold mb-3">Proyecto replicable</h3>
          <p className="text-sm text-gray-600 mb-3">
            Números Rojos es un proyecto de código abierto pensado para ser adaptado a otras
            instituciones. El repositorio se puede clonar, adaptar y distribuir libre bajo licencia MIT.
          </p>
          <a
            href="https://github.com/glesende/numeros-rojos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-rojo hover:text-rojo-dark"
          >
            Ver repositorio en GitHub →
          </a>
        </section>
        </div>
        </div>
      </section>
    </div>
    </>
  );
}
