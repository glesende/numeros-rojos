import { useState } from 'react';

const emptyForm = {
  description: '',
  type: 'cobro',
  amount: '',
  currency: 'ARS',
  record_date: '',
  official: false,
  carried_out: false,
  links: [],
};

export default function EconomyForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [linkInput, setLinkInput] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addLink = () => {
    if (linkInput.trim()) {
      set('links', [...(form.links || []), linkInput.trim()]);
      setLinkInput('');
    }
  };

  const removeLink = (i) => {
    set('links', form.links.filter((_, idx) => idx !== i));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, amount: parseFloat(form.amount), official: !!form.official, carried_out: !!form.carried_out });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Descripcion *</label>
          <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="input-field"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo *</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className="input-field">
            <option value="cobro">Cobro</option>
            <option value="pago">Pago</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Moneda *</label>
          <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className="input-field">
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Monto *</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha *</label>
          <input
            type="date"
            value={form.record_date}
            onChange={(e) => set('record_date', e.target.value)}
            className="input-field"
            required
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.official}
            onChange={(e) => set('official', e.target.checked)}
            className="rounded border-gray-300 text-rojo focus:ring-rojo"
          />
          Dato oficial
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.carried_out}
            onChange={(e) => set('carried_out', e.target.checked)}
            className="rounded border-gray-300 text-rojo focus:ring-rojo"
          />
          Efectuado
        </label>
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
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="truncate flex-1 text-gray-600">{l}</span>
                <button type="button" onClick={() => removeLink(i)} className="text-red-500 text-xs">
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
