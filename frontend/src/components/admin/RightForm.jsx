import { useState, useEffect } from 'react';

const emptyForm = {
  external_id: '',
  full_name: '',
  clauses: [],
};

export default function RightForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(emptyForm);
  const [clausulaInput, setClausulaInput] = useState('');

  useEffect(() => {
    if (initial) {
      setForm({
        external_id: initial.external_id || '',
        full_name: initial.full_name || '',
        clauses: initial.clauses || [],
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      clauses: form.clauses.length > 0 ? form.clauses : null,
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

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Clausulas</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={clausulaInput}
            onChange={(e) => setClausulaInput(e.target.value)}
            className="input-field flex-1"
            placeholder="Ej: Porcentaje de futura venta 20%"
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

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
