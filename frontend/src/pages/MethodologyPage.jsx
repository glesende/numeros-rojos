import { useEffect } from 'react';

export default function MethodologyPage() {
  useEffect(() => {
    document.title = 'Metodología y Fuentes | Números Rojos';
    return () => { document.title = 'Números Rojos'; };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Metodologia y Fuentes</h1>
      <p className="text-gray-500 text-sm mb-8">
        Como recopilamos, verificamos y clasificamos la informacion.
      </p>

      <div className="space-y-6">
        <section className="card">
          <h2 className="text-lg font-bold mb-3">Fuentes de datos</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <strong>Economia:</strong> Balances publicados por el club, notas periodisticas
              de medios especializados en futbol argentino, y declaraciones de dirigentes.
            </li>
            <li>
              <strong>Contratos:</strong> Informacion publicada en medios, datos de
              transferencias internacionales y registros publicos disponibles.
            </li>
            <li>
              <strong>Estadisticas:</strong> API de BeSoccer para datos en tiempo real
              de posiciones, goles, tarjetas y rendimiento general.
            </li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold mb-3">Marca "Oficial"</h2>
          <p className="text-sm text-gray-600">
            Los registros marcados como "Oficial" indican que la informacion fue confirmada
            directamente por el Club Atletico Independiente o proviene de documentos oficiales.
            Los no oficiales son estimaciones o datos periodisticos.
          </p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold mb-3">Actualizacion</h2>
          <p className="text-sm text-gray-600">
            La base de datos se actualiza manualmente conforme se obtienen nuevos datos.
            Las estadisticas deportivas se actualizan automaticamente via la API de BeSoccer
            con cache configurable para optimizar el rendimiento.
          </p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold mb-3">Limitaciones</h2>
          <p className="text-sm text-gray-600">
            Este portal es un proyecto independiente de datos abiertos. No es una publicacion
            oficial del Club Atletico Independiente. Los montos pueden estar sujetos a variaciones
            cambiarias y las estimaciones salariales son aproximadas.
          </p>
        </section>
      </div>
    </div>
  );
}
