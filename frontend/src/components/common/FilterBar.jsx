export default function FilterBar({ children, onReset }) {
  return (
    <div className="card mb-6">
      <div className="flex flex-wrap items-end gap-4">
        {children}
        {onReset && (
          <button onClick={onReset} className="btn-secondary text-sm w-full sm:w-auto">
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
