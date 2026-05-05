import { useState, useEffect } from 'react';
import { getPlayerMatches, getContracts } from '../../api/endpoints';
import Loader from '../common/Loader';
import OfficialBadge from '../OfficialBadge';
import SourceLabel from '../SourceLabel';
import PlayerAvatar from '../PlayerAvatar';

const ROLE_LABELS = { '1': 'Arqueros', '2': 'Defensores', '3': 'Mediocampistas', '4': 'Delanteros' };

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function PlayerMatchesSection({ player }) {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setMatches(null);
    getPlayerMatches(player.id)
      .then((res) => setMatches(res.data?.data?.match || []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [player.id]);

  const totals = matches?.reduce(
    (acc, m) => ({
      pj: acc.pj + 1,
      goals: acc.goals + (Number(m.goals) || 0),
      asis: acc.asis + (Number(m.asis) || 0),
      yc: acc.yc + (Number(m.yc) || 0),
      rc: acc.rc + (Number(m.rc) || 0),
      minutes: acc.minutes + (Number(m.minutes) > 0 ? Number(m.minutes) : 0),
      wins: acc.wins + (m.player_winner === 'w' ? 1 : 0),
    }),
    { pj: 0, goals: 0, asis: 0, yc: 0, rc: 0, minutes: 0, wins: 0 }
  );

  return (
    <div>
      {loading ? (
        <div className="py-8"><Loader /></div>
      ) : !matches || matches.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">Sin partidos registrados</p>
      ) : (
        <>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-6">
            {[
              { label: 'PJ', value: totals.pj },
              { label: 'Victorias', value: totals.wins },
              { label: 'Goles', value: totals.goals },
              { label: 'Asist.', value: totals.asis },
              { label: 'Minutos', value: totals.minutes },
              { label: 'Amarillas', value: totals.yc },
              { label: 'Rojas', value: totals.rc },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-2 bg-gray-50 rounded-xl">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b uppercase tracking-wide">
                  <th className="pb-2 pr-3"></th>
                  <th className="pb-2 pr-3">Partido</th>
                  <th className="pb-2 text-center px-2">Min</th>
                  <th className="pb-2 text-center px-2">G</th>
                  <th className="pb-2 text-center px-2">A</th>
                  <th className="pb-2 text-center px-2">🟨</th>
                  <th className="pb-2 text-center px-2">🟥</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const score = `${m.r1}–${m.r2}`;
                  const date = new Date(m.shedule);
                  const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

                  return (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <img src={m.competition_logo} alt="" className="h-4 w-auto flex-shrink-0" />
                          <span className="text-xs text-gray-400">{dateStr}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">
                        {m.team1_name} <span className="text-gray-400">{score}</span> {m.team2_name}
                      </td>
                      <td className="py-2 text-center px-2 text-gray-500">
                        {Number(m.minutes) > 0 ? m.minutes : '–'}
                      </td>
                      <td className="py-2 text-center px-2">{m.goals || 0}</td>
                      <td className="py-2 text-center px-2">{m.asis || 0}</td>
                      <td className="py-2 text-center px-2">{m.yc || 0}</td>
                      <td className="py-2 text-center px-2">{m.rc || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PlayerContractSection({ player }) {
  const [contract, setContract] = useState(undefined); // undefined = loading, null = not found
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setContract(undefined);
    getContracts({ external_id: player.id, status: 'vigente', per_page: 1 })
      .then((res) => {
        const results = res.data?.data || [];
        setContract(results.length > 0 ? results[0] : null);
      })
      .catch(() => setContract(null))
      .finally(() => setLoading(false));
  }, [player.id]);

  if (loading) return <div className="py-8"><Loader /></div>;

  if (!contract) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center">
        No existe un contrato activo con el club.
      </p>
    );
  }

  const allClauses = [...(contract.clauses || []), ...(contract.loan?.clauses || [])];

  return (
    <div className="space-y-4 text-sm">
      {contract.loan && (
        <div className="p-3 bloque-prestamo">
          <p className="bloque-prestamo-titulo mb-2">
            Cedido a préstamo en {contract.loan.club}
          </p>
          {contract.loan.until && (
            <p className="text-xs text-gray-500">
              Hasta: <span className="font-medium text-gray-700">{formatDate(contract.loan.until)}</span>
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {contract.signing_date && (
          <div>
            <p className="text-xs text-gray-500">Fecha de firma</p>
            <p className="font-medium">{formatDate(contract.signing_date)}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500">Vencimiento</p>
          <p className="font-medium">{formatDate(contract.expiration_date)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Propiedad</p>
          <p className="font-mono font-bold text-base">{contract.club_pass_percentage}%</p>
        </div>
        {contract.estimated_salary && (
          <div>
            <p className="text-xs text-gray-500">Salario estimado</p>
            <p className="font-mono font-bold text-base">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: contract.currency || 'USD',
                maximumFractionDigits: 0,
              }).format(contract.estimated_salary)}
            </p>
          </div>
        )}
      </div>

      {allClauses.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Cláusulas</p>
          <ul className="space-y-1">
            {allClauses.map((c, i) => (
              <li key={i} className="bg-gray-50 px-3 py-2 rounded break-words">{c}</li>
            ))}
          </ul>
        </div>
      )}

      {contract.links?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Fuentes</p>
          <ul className="space-y-1">
            {contract.links.map((link, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-rojo hover:underline text-xs">
                  <SourceLabel url={link.url} />
                </a>
                {link.official && <OfficialBadge />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { key: 'stats', label: 'Estadísticas' },
  { key: 'contract', label: 'Contrato' },
];

export default function PlayerMatchesModal({ player, onClose }) {
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    setTab('stats');
  }, [player?.id]);

  if (!player) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <PlayerAvatar src={player.image} alt={player.nick} className="w-9 h-9" />
            <div>
              <p className="font-bold text-sm leading-tight">{player.nick}</p>
              {(player.squadNumber || player.role) && (
                <p className="text-xs text-gray-500">
                  {player.squadNumber ? `#${player.squadNumber}` : ''}
                  {player.squadNumber && player.role ? ' · ' : ''}
                  {ROLE_LABELS[player.role] || ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b sticky top-[69px] bg-white z-10">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-rojo text-rojo'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4">
          {tab === 'stats' && <PlayerMatchesSection player={player} />}
          {tab === 'contract' && <PlayerContractSection player={player} />}
        </div>
      </div>
    </div>
  );
}
