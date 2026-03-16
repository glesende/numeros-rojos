import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBalance, getBalanceDownloadUrl } from '../api/endpoints';
import Loader from '../components/common/Loader';
import BalanceBreakdownTable from '../components/balances/BalanceBreakdownTable';
import BalanceLineChart from '../components/balances/BalanceLineChart';

const CURRENCIES = ['ARS', 'USD', 'EUR'];

export default function BalanceDetailPage() {
  const { id } = useParams();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('ARS');

  useEffect(() => {
    setLoading(true);
    getBalance(id)
      .then((res) => {
        const d = res.data?.data;
        setBalance(d);
        document.title = `Números Rojos | Balance ${d?.exercise || ''}`;
      })
      .catch(() => setError('No se pudo cargar el balance.'))
      .finally(() => setLoading(false));

    return () => { document.title = 'Números Rojos'; };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Loader />
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">
        {error || 'Balance no encontrado.'}
        <div className="mt-4">
          <Link to="/balances" className="text-rojo hover:underline">Volver a Balances</Link>
        </div>
      </div>
    );
  }

  // Determine available currencies in the breakdown
  const availableCurrencies = [...new Set((balance.breakdown || []).map((r) => r.currency))];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/balances" className="text-rojo text-sm hover:underline">&larr; Balances</Link>
        <h1 className="text-3xl font-extrabold mt-1">Balance {balance.exercise}</h1>
        {balance.published_at && (
          <p className="text-sm text-gray-500 mt-1">
            Publicado el {new Date(balance.published_at).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        )}
        {balance.dollar_reference && (
          <p className="text-sm text-gray-500">
            Dólar de referencia: <strong>${Number(balance.dollar_reference).toLocaleString('es-AR')}</strong>
          </p>
        )}
      </div>

      {/* Download file card */}
      {balance.has_file && (
        <div className="card mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-800">Documento oficial del balance</p>
            <p className="text-sm text-gray-500">{balance.file_original_name}</p>
          </div>
          <a
            href={getBalanceDownloadUrl(id)}
            className="btn-primary flex items-center gap-2 text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Descargar
          </a>
        </div>
      )}

      {/* Evolution chart */}
      <div className="mb-6">
        <BalanceLineChart compact={false} showLink={false} />
      </div>

      {/* Breakdown table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Desglose del balance</h2>
          {availableCurrencies.length > 1 && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {CURRENCIES.filter((c) => availableCurrencies.includes(c)).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    currency === c
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <BalanceBreakdownTable breakdown={balance.breakdown || []} currency={currency} />
      </div>
    </div>
  );
}
