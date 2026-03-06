export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-1">Metodologia y Fuentes</h1>
      <p className="text-gray-500 text-sm mb-8">
        Como recopilamos, verificamos y clasificamos la informacion.
      </p>

      <div className="space-y-6">
        <section className="card">
          <h2 className="text-lg font-bold mb-3">Niveles de confianza</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="badge-high mt-0.5">Alta</span>
              <p className="text-gray-600">
                Dato confirmado por fuentes oficiales del club, documentos publicos,
                o multiples medios de alta credibilidad.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="badge-medium mt-0.5">Media</span>
              <p className="text-gray-600">
                Dato reportado por medios especializados o fuentes cercanas al club,
                sin confirmacion oficial directa.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="badge-low mt-0.5">Baja</span>
              <p className="text-gray-600">
                Dato basado en estimaciones, rumores periodisticos o fuentes no verificadas.
                Se incluye por transparencia pero debe tomarse con precaucion.
              </p>
            </div>
          </div>
        </section>

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
