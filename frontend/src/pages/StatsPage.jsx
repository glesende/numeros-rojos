import { useState, useEffect } from 'react';
import { getStandings, getLeagueStats } from '../api/endpoints';
import Loader from '../components/common/Loader';
import StatCard from '../components/common/StatCard';

export default function StatsPage() {
  const [standings, setStandings] = useState(null);
  const [leagueStats, setLeagueStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.allSettled([getStandings(), getLeagueStats()])
      .then(([standingsRes, leagueRes]) => {
        if (standingsRes.status === 'fulfilled') {
          setStandings(standingsRes.value.data);
        }
        if (leagueRes.status === 'fulfilled') {
          setLeagueStats(leagueRes.value.data);
        }
        if (standingsRes.status === 'rejected' && leagueRes.status === 'rejected') {
          setError('No se pudieron obtener las estadisticas. Verifique la configuracion de BeSoccer.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Rendimiento Deportivo</h1>
      <p className="text-gray-500 text-sm mb-6">
        Estadisticas en tiempo real via BeSoccer.
      </p>

      {loading && <Loader />}

      {error && (
        <div className="card border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
          <p className="font-semibold mb-1">Datos no disponibles</p>
          <p>{error}</p>
          <p className="mt-2 text-xs">
            Asegurese de configurar BESOCCER_API_KEY en el archivo .env del backend.
          </p>
        </div>
      )}

      {!loading && standings?.success && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Posiciones</h2>
          <div className="card overflow-x-auto">
            {Array.isArray(standings.data) ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500 uppercase">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Equipo</th>
                    <th className="pb-3 pr-4">PJ</th>
                    <th className="pb-3 pr-4">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.data.map((team, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{team.rank || i + 1}</td>
                      <td className="py-2 pr-4 font-medium">{team.team || team.name}</td>
                      <td className="py-2 pr-4">{team.played || team.pj}</td>
                      <td className="py-2 pr-4 font-bold">{team.points || team.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-sm">Formato de datos no reconocido.</p>
            )}
          </div>
        </div>
      )}

      {!loading && leagueStats?.success && (
        <div>
          <h2 className="text-lg font-bold mb-4">Estadisticas de liga</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {typeof leagueStats.data === 'object' &&
              Object.entries(leagueStats.data).slice(0, 6).map(([key, val]) => (
                <StatCard key={key} label={key.replace(/_/g, ' ')} value={String(val)} />
              ))}
          </div>
        </div>
      )}

      {!loading && !error && !standings?.success && !leagueStats?.success && (
        <div className="card text-center text-gray-500 py-12">
          <p className="text-lg font-semibold mb-2">Sin datos disponibles</p>
          <p className="text-sm">
            Configure la API key de BeSoccer para ver estadisticas en tiempo real.
          </p>
        </div>
      )}
    </div>
  );
}
