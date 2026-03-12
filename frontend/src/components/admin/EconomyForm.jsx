import { useState } from 'react';

const emptyForm = {
  descripcion: '',
  tipo: 'cobro',
  monto: '',
  moneda: 'ARS',
  fecha: '',
  oficial: false,
  efectuado: false,
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
    onSubmit({ ...form, monto: parseFloat(form.monto), oficial: !!form.oficial, efectuado: !!form.efectuado });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Descripcion *</label>
        <textarea
          value={form.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          className="input-field"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo *</label>
          <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)} className="input-field">
            <option value="cobro">Cobro</option>
            <option value="pago">Pago</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Moneda *</label>
          <select value={form.moneda} onChange={(e) => set('moneda', e.target.value)} className="input-field">
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
            value={form.monto}
            onChange={(e) => set('monto', e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha *</label>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => set('fecha', e.target.value)}
            className="input-field"
            required
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.oficial}
            onChange={(e) => set('oficial', e.target.checked)}
            className="rounded border-gray-300 text-rojo focus:ring-rojo"
          />
          Dato oficial
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.efectuado}
            onChange={(e) => set('efectuado', e.target.checked)}
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
