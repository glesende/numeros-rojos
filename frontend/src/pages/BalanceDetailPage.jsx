import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBalance, getBalanceDownloadUrl } from '../api/endpoints';
import { usePageMeta } from '../hooks/usePageMeta';
import Loader from '../components/common/Loader';
import BalanceBreakdownTable from '../components/balances/BalanceBreakdownTable';

export default function BalanceDetailPage() {
  const { id } = useParams();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    getBalance(id)
      .then((res) => {
        const d = res.data?.data;
        setBalance(d);
      })
      .catch(() => setError('No se pudo cargar el balance.'))
      .finally(() => setLoading(false));
  }, [id]);

  const metaTitle = balance
    ? `Balance ${balance.exercise} de Independiente | Números Rojos`
    : null;

  const metaDescription = balance
    ? (() => {
        const parts = [`Balance patrimonial del ejercicio ${balance.exercise} del Club Atlético Independiente.`];
        if (balance.published_at) {
          const fecha = new Date(balance.published_at).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'long', year: 'numeric',
          });
          parts.push(`Publicado el ${fecha}.`);
        }
        parts.push('Datos en Números Rojos.');
        return parts.join(' ');
      })()
    : null;

  const structuredData = useMemo(() => {
    if (!balance) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `Balance ${balance.exercise} del Club Atlético Independiente`,
      description: metaDescription,
      url: `https://www.numerosrojos.net/balances/${id}`,
      dateModified: balance.updated_at,
      publisher: {
        '@type': 'Organization',
        name: 'Números Rojos',
        url: 'https://www.numerosrojos.net',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://www.numerosrojos.net/balances/${id}`,
      },
    };
  }, [balance, id, metaDescription]);

  usePageMeta({
    title: metaTitle,
    description: metaDescription,
    path: `/balances/${id}`,
    structuredData,
  });

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link to="/balances" className="text-rojo text-sm hover:underline">&larr; Balances</Link>
        <h1 className="text-3xl font-extrabold mt-1">Balance {balance.exercise}</h1>
        {balance.fecha && (
          <p className="text-sm text-gray-500 mt-1">
            Ejercicio al {new Date(balance.fecha).toLocaleDateString('es-AR', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        )}
        {balance.published_at && (
          <p className="text-sm text-gray-500">
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

      {/* Lines tree */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Desglose del balance</h2>
        <BalanceBreakdownTable lines={balance.lines || []} />
      </div>
    </div>
  );
}
