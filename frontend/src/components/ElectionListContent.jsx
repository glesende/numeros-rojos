import { useState, useEffect } from 'react';
import { getElectionCandidatePhotoUrl, getElectionCandidateCvUrl } from '../api/endpoints';

const TABS = [
  { key: 'propuestas', label: 'Propuestas' },
  { key: 'compromisos', label: 'Compromisos comprobables' },
];

function CommitmentList({ commitments }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {commitments.map((c) => (
        <li key={c.id} className="flex items-start gap-2 text-sm font-bold text-gray-900 bg-red-50 rounded-lg px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-rojo shrink-0 mt-1.5" aria-hidden="true" />
          <span>{c.description}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ElectionListContent({ list }) {
  const [tab, setTab] = useState('propuestas');

  useEffect(() => {
    setTab('propuestas');
  }, [list?.id]);

  const candidates = list.candidates || [];
  const proposals = list.proposals || [];
  const proposalsWithCommitments = proposals.filter((p) => (p.commitments?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      {/* Candidates */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-3">Candidatos</h3>
        {candidates.length === 0 ? (
          <p className="text-sm text-gray-400">No hay candidatos cargados.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {candidates.map((c) => (
              <div key={c.id} className="flex flex-col items-center text-center gap-1.5 p-2 rounded-lg bg-gray-50">
                {c.has_photo ? (
                  <img
                    src={getElectionCandidatePhotoUrl(c.id)}
                    alt={`${c.first_name} ${c.last_name}`}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-200" />
                )}
                <p className="text-xs font-semibold leading-tight">{c.first_name} {c.last_name}</p>
                <p className="text-[11px] text-gray-500 leading-tight">{c.position}</p>
                {c.has_cv && (
                  <a
                    href={getElectionCandidateCvUrl(c.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-rojo hover:underline font-medium"
                  >
                    Ver CV
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proposals / Commitments tabs */}
      <div>
        <div className="flex border-b mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-rojo text-rojo'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'propuestas' && (
          proposals.length === 0 ? (
            <p className="text-sm text-gray-400">No hay propuestas cargadas.</p>
          ) : (
            <ul className="space-y-4">
              {proposals.map((p) => (
                <li key={p.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{p.description}</p>
                  {(p.commitments?.length ?? 0) > 0 && (
                    <CommitmentList commitments={p.commitments} />
                  )}
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'compromisos' && (
          proposalsWithCommitments.length === 0 ? (
            <p className="text-sm text-gray-400">No hay compromisos cargados.</p>
          ) : (
            <ul className="space-y-4">
              {proposalsWithCommitments.map((p) => (
                <li key={p.id}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{p.title}</p>
                  <CommitmentList commitments={p.commitments} />
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
