import { useState, useEffect } from 'react';
import { getPlayerMatches } from '../../api/endpoints';
import Loader from '../common/Loader';

const ROLE_LABELS = { '1': 'Porteros', '2': 'Defensores', '3': 'Mediocampistas', '4': 'Delanteros' };

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
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b uppercase tracking-wide">
                  <th className="pb-2 pr-3">Competición</th>
                  <th className="pb-2 pr-3">Partido</th>
                  <th className="pb-2 text-center px-2">Res.</th>
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
                  const resultColor =
                    m.player_winner === 'w' ? 'text-ingreso' :
                    m.player_winner === 'l' ? 'text-egreso' :
                    'text-gray-400';
                  const resultLabel =
                    m.player_winner === 'w' ? 'G' :
                    m.player_winner === 'l' ? 'P' : 'E';
                  const date = new Date(m.shedule);
                  const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

                  return (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <img src={m.competition_logo} alt="" className="h-4 w-auto flex-shrink-0" />
                          <span className="text-xs text-gray-400 hidden sm:inline">{dateStr}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs whitespace-nowrap">
                        {m.team1_name} <span className="text-gray-400">{score}</span> {m.team2_name}
                      </td>
                      <td className={`py-2 text-center px-2 font-bold ${resultColor}`}>{resultLabel}</td>
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

export default function PlayerMatchesModal({ player, onClose }) {
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
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <img
              src={player.image}
              alt={player.nick}
              className="w-9 h-9 rounded-full object-cover bg-gray-100"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <p className="font-bold text-sm leading-tight">{player.nick}</p>
              <p className="text-xs text-gray-500">
                #{player.squadNumber} · {ROLE_LABELS[player.role] || ''}
              </p>
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
        <div className="p-4">
          <PlayerMatchesSection player={player} />
        </div>
      </div>
    </div>
  );
}
