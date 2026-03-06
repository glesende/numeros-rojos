import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Transparencia Economica',
    desc: 'Ingresos, egresos y balance del club. Ventas, compras, recaudacion y mas.',
    to: '/economia',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Transparencia Contractual',
    desc: 'Contratos vigentes, porcentajes de pase, salarios estimados y vencimientos.',
    to: '/contratos',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Rendimiento Deportivo',
    desc: 'Posiciones, estadisticas de jugadores y de la liga en tiempo real.',
    to: '/rendimiento',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Metodologia y Fuentes',
    desc: 'Como recopilamos y verificamos la informacion. Niveles de confianza.',
    to: '/metodologia',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-rojo text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Los datos que todo socio de<br />Independiente tiene que saber
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Portal de datos abiertos del Club Atletico Independiente.
            Transparencia economica, contractual y deportiva.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="card group hover:shadow-md hover:border-rojo/20 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="text-rojo flex-shrink-0 mt-1">{s.icon}</div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-rojo transition-colors">
                    {s.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
