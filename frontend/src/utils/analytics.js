// Métricas de uso propias y anónimas (ver docs/analytics.md). El id es aleatorio y vive en localStorage:
// no se deriva de la persona, y el backend solo guarda su HMAC (sin IP).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const STORAGE_KEY = 'nr_visitor';

const PATH_SECTIONS = [
  ['/economia', 'economia'],
  ['/contratos', 'contratos'],
  ['/balances', 'balances'],
  ['/estadisticas', 'estadisticas'],
  ['/estadio', 'estadio'],
  ['/derechos', 'derechos'],
  ['/elecciones', 'elecciones'],
  ['/mis-propuestas-2026', 'elecciones'],
  ['/deudas-bancarias', 'bcra'],
];

export function sectionForPath(pathname) {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/admin')) return null;
  const hit = PATH_SECTIONS.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return hit ? hit[1] : null;
}

function visitorId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

const sentThisPage = new Set();

export function trackSection(section) {
  const id = visitorId();
  if (!section || !id) return;
  fetch(`${API_URL}/analytics/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, visitor_id: id }),
    keepalive: true,
  }).catch(() => {});
}

export function trackView(pathname) {
  trackSection(sectionForPath(pathname));
}

/** Una vez por carga de página: para secciones que viven dentro de otra página (ej. rumores en la home). */
export function trackSectionOnce(section) {
  if (sentThisPage.has(section)) return;
  sentThisPage.add(section);
  trackSection(section);
}

const SESSION_KEY = 'nr_session';

/**
 * Primera visita de la sesión (sessionStorage): manda la página de entrada y los utm_* del link, si los hay.
 * Solo se envía el pathname (sin query) y nada de referrer; el backend descarta utm con formato raro.
 */
export function trackOrigin(pathname, search = '') {
  if (pathname.startsWith('/admin')) return;
  const id = visitorId();
  if (!id) return;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    return;
  }
  const params = new URLSearchParams(search);
  fetch(`${API_URL}/analytics/origin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visitor_id: id,
      entry_path: pathname.slice(0, 120),
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    }),
    keepalive: true,
  }).catch(() => {});
}
