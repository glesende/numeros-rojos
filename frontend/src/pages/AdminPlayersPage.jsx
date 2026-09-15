import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminPlayers, updatePlayerExtra } from '../api/endpoints';
import Loader from '../components/common/Loader';
import PlayerAvatar from '../components/PlayerAvatar';
import QuickFilterPills from '../components/common/QuickFilterPills';
import { translatePosition } from '../utils/positions';

const SECTION_META = {
  plantel:   { label: 'Plantel',   className: 'bg-blue-50 text-blue-700' },
  contratos: { label: 'Contratos', className: 'bg-green-50 text-green-700' },
  mercado:   { label: 'Mercado',   className: 'bg-purple-50 text-purple-700' },
  derechos:  { label: 'Derechos',  className: 'bg-amber-50 text-amber-700' },
};

function hasNoSection(sections) {
  const s = sections || {};
  return !s.plantel && !s.contratos && !s.mercado && !s.derechos;
}

function SectionBadges({ sections }) {
  if (hasNoSection(sections)) {
    return <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Ninguna</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(SECTION_META)
        .filter(([key]) => sections?.[key])
        .map(([key, meta]) => (
          <span key={key} className={`text-xs px-1.5 py-0.5 rounded ${meta.className}`}>
            {meta.label}
          </span>
        ))}
    </div>
  );
}

function PlayerExtraModal({ player, existingRepresentatives, onClose, onSaved }) {
  const [representative, setRepresentative] = useState(player.representative || '');
  const [representativeUrl, setRepresentativeUrl] = useState(player.representative_url || '');
  const [isAcademy, setIsAcademy] = useState(!!player.is_academy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        representative: representative.trim() || null,
        representative_url: representativeUrl.trim() || null,
        is_academy: isAcademy,
      };
      await updatePlayerExtra(player.id, payload);
      onSaved(payload);
    } catch {
      setError('No se pudo guardar. Verificá los datos e intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b">
          <PlayerAvatar src={player.image} alt={player.nick} className="w-10 h-10" />
          <div>
            <p className="font-bold text-sm leading-tight">{player.nick}</p>
            {player.pos1 && <p className="text-xs text-gray-500">{translatePosition(player.pos1)}</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Representante</label>
            <input
              type="text"
              value={representative}
              onChange={(e) => setRepresentative(e.target.value)}
              placeholder="Elegí uno existente o escribí uno nuevo"
              className="input-field w-full"
              list="representative-options"
            />
            <datalist id="representative-options">
              {existingRepresentatives.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Link del representante</label>
            <input
              type="url"
              value={representativeUrl}
              onChange={(e) => setRepresentativeUrl(e.target.value)}
              placeholder="https://..."
              className="input-field w-full"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAcademy}
              onChange={(e) => setIsAcademy(e.target.checked)}
              className="rounded"
            />
            Surgido de las Inferiores
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPlayersPage() {
  const [squad, setSquad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [search, setSearch] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('all');

  const fetchData = () => {
    setLoading(true);
    getAdminPlayers()
      .then((res) => setSquad(res.data?.data?.squad || []))
      .catch(() => setError('No se pudo obtener el plantel. Verificá la configuración de BeSoccer en el admin.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const existingRepresentatives = [...new Set(
    squad.map((p) => (p.representative || '').trim()).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  const pendingCount = squad.filter((p) => !p.reviewed).length;
  const sectionCounts = Object.keys(SECTION_META).reduce((acc, key) => {
    acc[key] = squad.filter((p) => p.sections?.[key]).length;
    return acc;
  }, {});
  const noSectionCount = squad.filter((p) => hasNoSection(p.sections)).length;
  const contratosActivosCount = squad.filter((p) => p.sections?.contratos && p.contract_vigente).length;
  const contratosInactivosCount = squad.filter((p) => p.sections?.contratos && !p.contract_vigente).length;

  const filteredSquad = squad
    .filter((p) => (p.nick || '').toLowerCase().includes(search.trim().toLowerCase()))
    .filter((p) => !showPendingOnly || !p.reviewed)
    .filter((p) => {
      if (sectionFilter === 'all') return true;
      if (sectionFilter === 'none') return hasNoSection(p.sections);
      if (sectionFilter === 'contratos_activos') return !!p.sections?.contratos && !!p.contract_vigente;
      if (sectionFilter === 'contratos_inactivos') return !!p.sections?.contratos && !p.contract_vigente;
      return !!p.sections?.[sectionFilter];
    });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="text-rojo text-sm hover:underline">&larr; Admin</Link>
        <h1 className="text-2xl font-extrabold">Jugadores</h1>
        <p className="text-sm text-gray-500">
          Representante y jugador de inferiores para cada ficha del plantel.
          {pendingCount > 0 && ` ${pendingCount} sin revisar.`}
        </p>
      </div>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">{error}</p>
        </div>
      ) : (
        <>
          <QuickFilterPills
            options={[
              { label: 'Todos', active: !showPendingOnly, onClick: () => setShowPendingOnly(false) },
              { label: `Pendientes (${pendingCount})`, active: showPendingOnly, onClick: () => setShowPendingOnly(true) },
            ]}
          />

          <QuickFilterPills
            options={[
              { label: `Todas las secciones (${squad.length})`, active: sectionFilter === 'all', onClick: () => setSectionFilter('all') },
              ...Object.entries(SECTION_META).flatMap(([key, meta]) => {
                if (key === 'contratos') {
                  return [
                    {
                      label: `Contratos Activos (${contratosActivosCount})`,
                      active: sectionFilter === 'contratos_activos',
                      onClick: () => setSectionFilter('contratos_activos'),
                    },
                    {
                      label: `Contratos Inactivos (${contratosInactivosCount})`,
                      active: sectionFilter === 'contratos_inactivos',
                      onClick: () => setSectionFilter('contratos_inactivos'),
                    },
                  ];
                }
                return [{
                  label: `${meta.label} (${sectionCounts[key]})`,
                  active: sectionFilter === key,
                  onClick: () => setSectionFilter(key),
                }];
              }),
              { label: `Ninguna (${noSectionCount})`, active: sectionFilter === 'none', onClick: () => setSectionFilter('none') },
            ]}
          />

          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de jugador..."
              className="input-field w-full max-w-sm"
            />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500 uppercase">
                  <th className="pb-3 pr-4">Jugador</th>
                  <th className="pb-3 pr-4">Secciones</th>
                  <th className="pb-3 pr-4">Representante</th>
                  <th className="pb-3 text-center">Inferiores</th>
                </tr>
              </thead>
              <tbody>
                {filteredSquad.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No se encontraron jugadores.
                    </td>
                  </tr>
                ) : filteredSquad.map((player, index) => (
                  <tr
                    key={player.id}
                    className={`border-b border-gray-100 ${
                      !player.reviewed ? 'bg-amber-50' : index % 2 === 1 ? 'bg-gray-50' : ''
                    }`}
                  >
                    <td className="py-2 pr-4 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingPlayer(player)}
                        className="flex items-center gap-1.5 hover:underline text-left"
                      >
                        {!player.reviewed && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"
                            title="Sin revisar"
                          />
                        )}
                        {player.nick}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <SectionBadges sections={player.sections} />
                    </td>
                    <td className="py-2 pr-4">
                      {player.representative ? (
                        player.representative_url ? (
                          <a
                            href={player.representative_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rojo hover:underline"
                          >
                            {player.representative}
                          </a>
                        ) : (
                          player.representative
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {player.is_academy ? (
                        <span className="text-green-600" aria-label="Sí">✓</span>
                      ) : (
                        <span className="text-gray-300" aria-label="No">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingPlayer && (
        <PlayerExtraModal
          player={editingPlayer}
          existingRepresentatives={existingRepresentatives}
          onClose={() => setEditingPlayer(null)}
          onSaved={(payload) => {
            setSquad((prev) =>
              prev.map((p) => (p.id === editingPlayer.id ? { ...p, ...payload, reviewed: true } : p))
            );
            setEditingPlayer(null);
          }}
        />
      )}
    </div>
  );
}
