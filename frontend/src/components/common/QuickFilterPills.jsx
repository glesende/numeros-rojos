export default function QuickFilterPills({ options }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {options.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={opt.onClick}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            opt.active
              ? 'bg-rojo text-white border-rojo'
              : 'bg-white text-gray-600 border-gray-200 hover:border-rojo hover:text-rojo'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
