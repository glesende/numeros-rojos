import { useState, useEffect } from 'react';

const emptyForm = {
  external_id: '',
  full_name: '',
  expiration_date: '',
  club_pass_percentage: '',
  estimated_salary: '',
  currency: 'USD',
  official: false,
  clauses: [],
  links: [],
};

export default function ContractForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(emptyForm);
  const [clausulaInput, setClausulaInput] = useState('');
  const [linkInput, setLinkInput] = useState('');

  useEffect(() => {
    if (initial) {
      const expDate = initial.expiration_date;
      const formattedDate = expDate ? expDate.split('T')[0] : '';
      setForm({
        external_id: initial.external_id || '',
        full_name: initial.full_name || '',
        expiration_date: formattedDate,
        club_pass_percentage: initial.club_pass_percentage?.toString() || '',
        estimated_salary: initial.estimated_salary?.toString() || '',
        currency: initial.currency || 'USD',
        official: initial.official ?? false,
        clauses: initial.clauses || [],
        links: initial.links || [],
      });
    }
  }, [initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addClausula = () => {
    if (clausulaInput.trim()) {
      set('clauses', [...(form.clauses || []), clausulaInput.trim()]);
      setClausulaInput('');
    }
  };

  const removeClausula = (i) => {
    set('clauses', form.clauses.filter((_, idx) => idx !== i));
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
      club_pass_percentage: parseFloat(form.club_pass_percentage),
      estimated_salary: form.estimated_salary ? parseFloat(form.estimated_salary) : null,
      currency: form.estimated_salary ? form.currency : null,
      official: !!form.official,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">ID Externo</label>
        <input
          type="text"
          value={form.external_id}
          onChange={(e) => set('external_id', e.target.value)}
          className="input-field"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha vencimiento *</label>
          <input
            type="date"
            value={form.expiration_date}
            onChange={(e) => set('expiration_date', e.target.value)}
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
            value={form.club_pass_percentage}
            onChange={(e) => set('club_pass_percentage', e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Salario estimado</label>
          <input
            type="number"
            step="0.01"
            value={form.estimated_salary}
            onChange={(e) => set('estimated_salary', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Moneda</label>
          <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className="input-field">
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
            <option value="EUR">EUR</option>
          </select>
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
        {form.clauses?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {form.clauses.map((c, i) => (
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
