import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getBalances } from '../api/endpoints';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import BalanceLineChart from '../components/balances/BalanceLineChart';

export default function BalancesPage() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchBalances = useCallback(() => {
    setLoading(true);
    setError(null);
    getBalances()
      .then((res) => {
        const list = res.data?.data || [];
        setBalances(list);
        if (list.length > 0) {
          const latest = list.reduce((max, b) => (b.created_at > max ? b.created_at : max), list[0].created_at);
          setLastUpdated(new Date(latest).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }));
        }
      })
      .catch(() => setError('No se pudieron cargar los balances. Intentá de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = 'Números Rojos | Balances oficiales';
    fetchBalances();
    return () => { document.title = 'Números Rojos'; };
  }, [fetchBalances]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold mb-1">Balances oficiales</h1>
      {lastUpdated && (
        <p className="text-xs text-gray-400 mb-2">Última actualización: {lastUpdated}</p>
      )}
      <p className="text-gray-500 text-sm mb-8">
        Documentos e información económica publicada oficialmente por el Club Atlético Independiente.
      </p>

      {/* Evolution chart */}
      <div className="mb-8">
        <BalanceLineChart compact={false} showLink={false} />
      </div>

      {/* Balances list */}
      <h2 className="text-xl font-bold mb-4">Documentos</h2>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="card">
          <ErrorMessage message={error} onRetry={fetchBalances} />
        </div>
      ) : balances.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          No hay balances publicados aún.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {balances.map((b) => (
            <Link
              key={b.id}
              to={`/balances/${b.id}`}
              className="card hover:shadow-md hover:border-rojo/20 transition-all duration-200 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-extrabold text-lg text-rojo">Ejercicio {b.exercise}</p>
                {b.published_at && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(b.published_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </p>
                )}
                {b.has_file && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium mt-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Documento disponible
                  </span>
                )}
              </div>
              <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
