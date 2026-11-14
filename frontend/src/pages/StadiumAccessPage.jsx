import { usePageMeta } from '../hooks/usePageMeta';
import AccessSummary from '../components/AccessSummary';
import BenchmarkResults from '../components/BenchmarkResults';

/**
 * Accesos al estadio: QR vs reconocimiento facial (tareas #372, #373, #379).
 * Página oculta: sin enlaces, noindex y fuera de la analítica. Solo lectura: no pide cámara ni permisos.
 */
export default function StadiumAccessPage() {
  usePageMeta({
    title: 'Accesos al estadio | Números Rojos',
    description: 'Análisis interno.',
    noindex: true,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold mb-1">Accesos al estadio: QR vs reconocimiento facial</h1>
        <p className="text-sm text-gray-500">Página interna, no pública.</p>
      </header>
      <AccessSummary />
      <BenchmarkResults />
    </div>
  );
}
