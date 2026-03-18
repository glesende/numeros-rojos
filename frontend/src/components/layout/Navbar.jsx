import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSectionSettings from '../../hooks/useSectionSettings';

const ALL_NAV_LINKS = [
  { to: '#compromisos-economicos', label: 'Economia', scrollTo: 'compromisos-economicos', isAnchor: true, sectionKey: 'section_economia_enabled' },
  { to: '#contratos', label: 'Contratos', scrollTo: 'contratos', isAnchor: true, sectionKey: 'section_contratos_enabled' },
  { to: '#balances', label: 'Balances', scrollTo: 'balances', isAnchor: true, sectionKey: 'section_balances_enabled' },
  { to: '/estadio', label: 'Estadio', isAnchor: false, sectionKey: 'section_estadio_enabled' },
  { to: '#metodologia', label: 'Metodologia', scrollTo: 'metodologia', isAnchor: true, sectionKey: null },
  { to: '#estadisticas', label: 'Estadísticas', scrollTo: 'estadisticas', isAnchor: true, sectionKey: null },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { sections } = useSectionSettings();

  const navLinks = ALL_NAV_LINKS.filter(
    (link) => link.sectionKey === null || sections[link.sectionKey] !== false
  );

  const handleNavClick = (e, link) => {
    if (link.isAnchor && location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(link.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setOpen(false);
    }
  };

  const isLinkActive = (link) => {
    if (link.isAnchor) {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(link.to);
  };

  return (
    <nav className="bg-rojo text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="font-extrabold text-lg tracking-tight">
            NUMEROS ROJOS
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLinkActive(link)
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/admin"
                className="ml-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isLinkActive(link)
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium bg-white/20"
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
