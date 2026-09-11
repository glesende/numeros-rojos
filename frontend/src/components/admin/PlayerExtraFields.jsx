import { useEffect, useRef } from 'react';
import { getPlayerExtra } from '../../api/endpoints';

export const emptyPlayerExtra = {
  representative: '',
  representative_url: '',
  is_academy: false,
};

export const normalizePlayerExtra = (extra) => ({
  representative: extra.representative.trim() || null,
  representative_url: extra.representative_url.trim() || null,
  is_academy: !!extra.is_academy,
});

export default function PlayerExtraFields({ externalId, value, onChange }) {
  const fetchedFor = useRef(null);

  useEffect(() => {
    const id = externalId?.trim();
    if (!id) return undefined;

    const timer = setTimeout(() => {
      if (fetchedFor.current === id) return;
      fetchedFor.current = id;
      getPlayerExtra(id)
        .then((res) => {
          const data = res.data?.data;
          if (data && (data.representative || data.representative_url || data.is_academy)) {
            onChange({
              representative: data.representative || '',
              representative_url: data.representative_url || '',
              is_academy: !!data.is_academy,
            });
          }
        })
        .catch(() => {});
    }, 500);

    return () => clearTimeout(timer);
  }, [externalId]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos del jugador</p>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Representante</label>
        <input
          type="text"
          value={value.representative}
          onChange={(e) => onChange({ ...value, representative: e.target.value })}
          placeholder="Nombre del representante"
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Link del representante</label>
        <input
          type="url"
          value={value.representative_url}
          onChange={(e) => onChange({ ...value, representative_url: e.target.value })}
          placeholder="https://..."
          className="input-field"
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={value.is_academy}
          onChange={(e) => onChange({ ...value, is_academy: e.target.checked })}
          className="rounded"
        />
        Surgido de las Inferiores
      </label>
    </div>
  );
}
