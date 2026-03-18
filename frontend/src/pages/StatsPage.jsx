import { useState, useEffect } from 'react';
import { getTeam } from '../api/endpoints';
import Loader from '../components/common/Loader';
import FormBadges from '../components/stats/FormBadges';
import PlayerCard from '../components/stats/PlayerCard';
import PlayerMatchesModal from '../components/stats/PlayerMatchesModal';

const ROLE_LABELS = { '1': 'Porteros', '2': 'Defensores', '3': 'Mediocampistas', '4': 'Delanteros' };
const ROLE_ORDER = ['1', '2', '3', '4'];

function computePJ(row) {
  return ['win_h', 'draw_h', 'lose_h', 'win_a', 'draw_a', 'lose_a']
    .reduce((sum, k) => sum + (Number(row[k]) || 0), 0);
}

function StandingsTable({ tables, teamId }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b uppercase tracking-wide">
            <th className="pb-2 pr-2 w-8">#</th>
            <th className="pb-2 pr-4">Equipo</th>
            <th className="pb-2 text-center px-2">PJ</th>
            <th className="pb-2 text-center px-2">G</th>
            <th className="pb-2 text-center px-2">E</th>
            <th className="pb-2 text-center px-2">P</th>
            <th className="pb-2 text-center px-2">GF</th>
            <th className="pb-2 text-center px-2">GC</th>
            <th className="pb-2 text-center px-2 font-bold text-gray-600">Pts</th>
            <th className="pb-2 pl-2">Forma</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((row) => {
            const isOurs = row.teamId === teamId;
            const pj = computePJ(row);
            const wins = Number(row.win_h) + Number(row.win_a);
            const draws = Number(row.draw_h) + Number(row.draw_a);
            const losses = Number(row.lose_h) + Number(row.lose_a);
            return (
              <tr
                key={row.team}
                className={`border-b last:border-0 ${
                  isOurs
                    ? 'bg-rojo/5'
                    : 'hover:bg-gray-50'
                }`}
              >
                <td className="py-2 pr-2 text-gray-400 text-xs">{row.position}</td>
                <td className={`py-2 pr-4 font-medium ${isOurs ? 'text-rojo font-bold' : ''}`}>
                  {row.nameShow}
                </td>
                <td className="py-2 text-center px-2 text-gray-500">{pj}</td>
                <td className="py-2 text-center px-2 text-ingreso font-medium">{wins}</td>
                <td className="py-2 text-center px-2 text-gray-400">{draws}</td>
                <td className="py-2 text-center px-2 text-egreso font-medium">{losses}</td>
                <td className="py-2 text-center px-2">{row.gf}</td>
                <td className="py-2 text-center px-2">{row.ga}</td>
                <td className="py-2 text-center px-2 font-bold">{row.points}</td>
                <td className="py-2 pl-2">
                  <FormBadges form={row.form} max={5} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StatsPage() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCompetition, setActiveCompetition] = useState(0);
  const [activeRole, setActiveRole] = useState('1');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    document.title = 'Estadísticas | Números Rojos';
    return () => { document.title = 'Números Rojos'; };
  }, []);

  useEffect(() => {
    getTeam()
      .then((res) => {
        const data = res.data?.data?.team;
        if (data) {
          setTeam(data);
        } else {
          setError('No se pudieron obtener los datos del equipo.');
        }
      })
      .catch(() => setError('Servicio de estadísticas no disponible. Verificá la configuración de BeSoccer en el admin.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20"><Loader /></div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="card text-center py-12">
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const competitions = team.competitions || [];
  const currentComp = competitions[activeCompetition];
  const isMainComp = currentComp?.id === team.category?.category_id;
  const myRow = team.tables?.find((t) => t.teamId === team.id);

  const wins = myRow ? Number(myRow.win_h) + Number(myRow.win_a) : 0;
  const draws = myRow ? Number(myRow.draw_h) + Number(myRow.draw_a) : 0;
  const losses = myRow ? Number(myRow.lose_h) + Number(myRow.lose_a) : 0;
  const pj = myRow ? computePJ(myRow) : 0;

  const squadByRole = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = (team.squad || []).filter((p) => p.role === role);
    return acc;
  }, {});

  const rolesWithPlayers = ROLE_ORDER.filter((r) => squadByRole[r]?.length > 0);

  return (
    <div>
      {/* Header */}
      <section className="bg-rojo text-white py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <img
              src={team.shield}
              alt={team.nameShow}
              className="w-16 h-16 object-contain flex-shrink-0"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">{team.fullName}</h1>
              <p className="text-white/70 text-sm mt-1">
                {team.stadium} · DT: {team.managerNow}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competition tabs */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {competitions.map((comp, i) => (
            <button
              key={`${comp.id}-${i}`}
              onClick={() => { setActiveCompetition(i); setSelectedPlayer(null); }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                activeCompetition === i
                  ? 'bg-rojo text-white border-rojo'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-rojo/40 hover:text-rojo'
              }`}
            >
              <img src={comp.logo} alt="" className="h-4 w-auto" />
              {comp.name}
            </button>
          ))}
        </div>

        {/* Main competition: stats cards + form + standings */}
        {isMainComp && myRow && (
          <>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
              {[
                { label: 'Posición', value: `${myRow.position}°`, highlight: true },
                { label: 'Puntos', value: myRow.points },
                { label: 'PJ', value: pj },
                { label: 'G / E / P', value: `${wins}/${draws}/${losses}` },
                { label: 'Goles a favor', value: myRow.gf },
                { label: 'Goles en contra', value: myRow.ga },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="card text-center py-3 px-2">
                  <p className={`text-xl font-extrabold ${highlight ? 'text-rojo' : ''}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="card mb-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                Últimas {myRow.form?.length} fechas
              </p>
              <FormBadges form={myRow.form} max={10} />
            </div>

            <div className="card">
              <h2 className="font-bold mb-4">
                {team.category.cat_name} {team.category.year}
                <span className="text-sm text-gray-400 font-normal ml-2">
                  · Fecha {team.category.current_round}/{competitions[0]?.phases?.[0]?.total_rounds}
                </span>
              </h2>
              <StandingsTable tables={team.tables} teamId={team.id} />
            </div>
          </>
        )}

        {/* Other competitions: phase info */}
        {!isMainComp && currentComp && (
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <img src={currentComp.logo} alt="" className="h-8 w-auto" />
              <div>
                <h2 className="font-bold">{currentComp.name} {currentComp.year}</h2>
              </div>
            </div>
            <div className="space-y-2">
              {currentComp.phases?.map((phase, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                  <span className="font-semibold">
                    {phase.type === 'playoffs' ? 'Playoffs' : 'Fase de grupos'}
                  </span>
                  {phase.is_current && (
                    <span className="text-xs bg-rojo/10 text-rojo px-2 py-0.5 rounded-full font-medium">
                      En curso
                    </span>
                  )}
                  <span className="text-gray-500">
                    Ronda {phase.current_round}/{phase.total_rounds} · {phase.total_teams} equipos
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Squad */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <h2 className="text-xl font-bold mb-4">Plantel {team.category?.year}</h2>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
          {rolesWithPlayers.map((role) => (
            <button
              key={role}
              onClick={() => { setActiveRole(role); setSelectedPlayer(null); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                activeRole === role
                  ? 'bg-rojo text-white border-rojo'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-rojo/40 hover:text-rojo'
              }`}
            >
              {ROLE_LABELS[role]}
              <span className="ml-1.5 text-xs opacity-70">({squadByRole[role].length})</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {squadByRole[activeRole]?.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              selected={selectedPlayer?.id === player.id}
              onClick={() => setSelectedPlayer(player)}
            />
          ))}
        </div>
      </section>

      <PlayerMatchesModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}
