import { useEffect } from 'react';
import { HIRING_PROTOCOL_EXAMPLES } from './myProposalsContent';

export default function HiringProtocolExamplesModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <p className="font-bold text-base leading-tight">Ejemplos del protocolo de contratación</p>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">
            Algunas normas concretas que podría incluir el protocolo de contratación propuesto.
          </p>
          {HIRING_PROTOCOL_EXAMPLES.map((example) => (
            <div key={example.title}>
              <p className="text-sm font-semibold text-gray-900">{example.title}</p>
              <p className="text-sm text-gray-600 mt-0.5">{example.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
