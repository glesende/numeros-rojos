import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeam } from '../../api/endpoints';
import FormBadges from './FormBadges';

export default function StatsWidget() {
  const [team, setTeam] = useState(null);

  useEffect(() => {
    getTeam()
      .then((res) => {
        const data = res.data?.data?.team;
        if (data?.tables) setTeam(data);
      })
      .catch(() => {});
  }, []);

  if (!team) return null;

  const competition = team.category;
  const myRow = team.tables?.find((t) => t.teamId === team.id);

  if (!myRow || !competition) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {competition.league_logo && (
            <img src={competition.league_logo} alt="" className="h-5 w-auto" />
          )}
          <h3 className="font-bold text-sm">{competition.cat_name} {competition.year}</h3>
          <span className="text-xs text-gray-400 hidden sm:inline">· Fecha {competition.current_round}</span>
        </div>
        <Link to="/estadisticas" className="text-xs text-rojo hover:underline font-medium flex-shrink-0">
          Ver todo →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-3xl font-extrabold text-rojo leading-none">{myRow.position}°</p>
          <p className="text-xs text-gray-500 mt-1">Posición</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-3xl font-extrabold leading-none">{myRow.points}</p>
          <p className="text-xs text-gray-500 mt-1">Puntos</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <p className="text-xl font-bold leading-none">
            {myRow.gf}
            <span className="text-gray-300 mx-1">–</span>
            {myRow.ga}
          </p>
          <p className="text-xs text-gray-500 mt-1">GF / GC</p>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl gap-2">
          <FormBadges form={myRow.form} max={5} />
          <p className="text-xs text-gray-500">Últimos 5</p>
        </div>
      </div>
    </div>
  );
}
