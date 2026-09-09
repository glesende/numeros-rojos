import { useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { AUTHOR_NAME, PROPOSALS } from '../components/myProposalsContent';
import HiringProtocolExamplesModal from '../components/HiringProtocolExamplesModal';

export default function MyProposalsPage() {
  const [showExamples, setShowExamples] = useState(false);

  usePageMeta({
    title: `Propuestas de ${AUTHOR_NAME} | Números Rojos`,
    description: `Propuestas de ${AUTHOR_NAME} para el Club Atlético Independiente, compartidas con las listas que se postulan en las elecciones 2026.`,
    path: '/mis-propuestas-2026',
    noindex: true,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold leading-tight">{AUTHOR_NAME}</h1>
        <p className="text-sm text-gray-500 mt-1">Propuestas para el Club Atlético Independiente — Elecciones 2026</p>
        <div className="flex flex-col items-start gap-2 mt-3">
          <a
            href="https://x.com/GatoLesende"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-rojo hover:underline"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Perfil en X
          </a>
          <a
            href="https://www.linkedin.com/in/glesende/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-rojo hover:underline"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.114 20.452H3.558V9h3.556v11.452z" />
            </svg>
            Perfil Linkedin
          </a>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Estas son propuestas propias que comparto con las listas que se postulan en las elecciones 2026 de
          Independiente, para que puedan sumarlas a sus plataformas si las consideran de valor.
        </p>
      </div>

      <div className="space-y-6">
        {PROPOSALS.map((proposal) => (
          <div key={proposal.id} className="card">
            <h2 className="text-base font-bold text-gray-900">{proposal.title}</h2>
            <div className="mt-2 space-y-3">
              {proposal.body.map((paragraph, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">{paragraph}</p>
              ))}
            </div>
            {proposal.hasExamples && (
              <button
                type="button"
                onClick={() => setShowExamples(true)}
                className="mt-3 text-xs text-rojo hover:underline font-medium inline-flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10A8 8 0 112 10a8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9zm1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                Ver ejemplos concretos del protocolo
              </button>
            )}
          </div>
        ))}
      </div>

      <HiringProtocolExamplesModal open={showExamples} onClose={() => setShowExamples(false)} />
    </div>
  );
}
