import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackView, trackOrigin } from '../utils/analytics';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackOrigin(location.pathname, location.search);
    trackView(location.pathname);
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
    });
  }, [location]);
}
