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
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-blue-800 font-semibold text-sm mb-2">
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

      {(() => {
        const url = `https://www.numerosrojos.net/contratos/${contract.id}`;
        const waText = `Mirá el contrato de ${player.nick} en Independiente. Datos en Números Rojos 👉 ${url}`;
        const xText = `Contrato de ${player.nick} (Independiente). Vía @NumerosRojos 👉 ${url}`;
        return (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">Compartir</span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-green-600 transition-colors"
              aria-label="Compartir por WhatsApp"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(xText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-900 transition-colors"
              aria-label="Compartir en X"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        );
      })()}
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
