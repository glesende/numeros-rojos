import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Única fuente de analítica: GA4 (se carga en index.html si VITE_GA_MEASUREMENT_ID está definido).
// page_location lleva la URL completa para que GA tome los utm_* de los links de difusión.
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);
}
