import { useState } from 'react';

const emptyForm = {
  nombre_completo: '',
  fecha_firma: '',
  fecha_caducidad: '',
  porcentaje_pase_club: '',
  salario_estimado: '',
  moneda: 'USD',
  oficial: false,
  confidence_level: 'medium',
  clausulas: [],
  links: [],
};

export default function ContractForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [clausulaInput, setClausulaInput] = useState('');
  const [linkInput, setLinkInput] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addClausula = () => {
    if (clausulaInput.trim()) {
      set('clausulas', [...(form.clausulas || []), clausulaInput.trim()]);
      setClausulaInput('');
    }
  };

  const removeClausula = (i) => {
    set('clausulas', form.clausulas.filter((_, idx) => idx !== i));
  };

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
    onSubmit({
      ...form,
      porcentaje_pase_club: parseFloat(form.porcentaje_pase_club),
      salario_estimado: form.salario_estimado ? parseFloat(form.salario_estimado) : null,
      moneda: form.salario_estimado ? form.moneda : null,
      oficial: !!form.oficial,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre completo *</label>
        <input
          type="text"
          value={form.nombre_completo}
          onChange={(e) => set('nombre_completo', e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha firma *</label>
          <input
            type="date"
            value={form.fecha_firma}
            onChange={(e) => set('fecha_firma', e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha vencimiento *</label>
          <input
            type="date"
            value={form.fecha_caducidad}
            onChange={(e) => set('fecha_caducidad', e.target.value)}
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">% Pase club *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.porcentaje_pase_club}
            onChange={(e) => set('porcentaje_pase_club', e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Salario estimado</label>
          <input
            type="number"
            step="0.01"
            value={form.salario_estimado}
            onChange={(e) => set('salario_estimado', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Moneda</label>
          <select value={form.moneda} onChange={(e) => set('moneda', e.target.value)} className="input-field">
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Confianza *</label>
          <select value={form.confidence_level} onChange={(e) => set('confidence_level', e.target.value)} className="input-field">
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.oficial}
              onChange={(e) => set('oficial', e.target.checked)}
              className="rounded border-gray-300 text-rojo focus:ring-rojo"
            />
            Dato oficial
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Clausulas</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={clausulaInput}
            onChange={(e) => setClausulaInput(e.target.value)}
            className="input-field flex-1"
            placeholder="Ej: Clausula de rescision USD 5M"
          />
          <button type="button" onClick={addClausula} className="btn-secondary text-sm">
            Agregar
          </button>
        </div>
        {form.clausulas?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {form.clausulas.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
                <span className="flex-1">{c}</span>
                <button type="button" onClick={() => removeClausula(i)} className="text-red-500 text-xs">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
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
