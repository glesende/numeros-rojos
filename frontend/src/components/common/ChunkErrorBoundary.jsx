import { Component } from 'react';

const RELOAD_FLAG = 'chunk-error-reload';

function isChunkLoadError(error) {
  const msg = String(error?.message || '');
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

export default class ChunkErrorBoundary extends Component {
  state = { hasError: false };

  componentDidMount() {
    // Boot exitoso: liberamos el flag para que un deploy futuro
    // en esta misma pestaña también dispare el auto-reload.
    sessionStorage.removeItem(RELOAD_FLAG);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      // Tras un deploy, los chunks viejos dejan de existir en el server.
      // Recargamos una sola vez para traer el index.html actualizado;
      // el flag evita un loop si el reload no resuelve el problema.
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) return null;
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-lg font-semibold">Ocurrió un error inesperado.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-rojo text-white"
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
