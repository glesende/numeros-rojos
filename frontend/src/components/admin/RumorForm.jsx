import { useState, useEffect } from 'react';

const emptyForm = {
  external_id: '',
  full_name: '',
  status: 'rumor',
  links: [],
};

const normalizeLink = (l) =>
  typeof l === 'string' ? { url: l, official: false } : { ...l, official: !!l.official };

export default function RumorForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(emptyForm);
  const [linkInput, setLinkInput] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        external_id: initial.external_id || '',
        full_name: initial.full_name || '',
        status: initial.status || 'rumor',
        links: (initial.links || []).map(normalizeLink),
      });
    }
  }, [initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addLink = () => {
    if (linkInput.trim()) {
      set('links', [...(form.links || []), { url: linkInput.trim(), official: false }]);
      setLinkInput('');
    }
  };

  const removeLink = (i) => {
    set('links', form.links.filter((_, idx) => idx !== i));
  };

  const toggleLinkOfficial = (i) => {
    set('links', form.links.map((l, idx) => idx === i ? { ...l, official: !l.official } : l));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      links: form.links.length > 0 ? form.links : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">ID Externo (BeSoccer)</label>
        <input
          type="text"
          value={form.external_id}
          onChange={(e) => set('external_id', e.target.value)}
          className="input-field"
          placeholder="Ej: 123456"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo *</label>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
        <div className="flex gap-3">
          {[
            { value: 'rumor', label: 'Rumor' },
            { value: 'contratado', label: 'Contratado' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={opt.value}
                checked={form.status === opt.value}
                onChange={() => set('status', opt.value)}
                className="text-rojo focus:ring-rojo"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Links / Fuentes</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            className="input-field flex-1"
            placeholder="https://..."
          />
          <button type="button" onClick={addLink} className="btn-secondary text-sm">
            Agregar
          </button>
        </div>
        {form.links?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {form.links.map((l, i) => (
              <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
                <span className="truncate flex-1 text-gray-600">{l.url}</span>
                <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <input
                    type="checkbox"
                    checked={l.official}
                    onChange={() => toggleLinkOfficial(i)}
                    className="rounded border-gray-300 text-rojo focus:ring-rojo"
                  />
                  Oficial
                </label>
                <button type="button" onClick={() => removeLink(i)} className="text-red-500 text-xs shrink-0">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
