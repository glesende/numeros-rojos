import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackView } from '../utils/analytics';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackView(location.pathname);
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
    });
  }, [location]);
}
