import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';
import { usePageTracking } from './hooks/usePageTracking';
import Layout from './components/layout/Layout';
import Loader from './components/common/Loader';
import ChunkErrorBoundary from './components/common/ChunkErrorBoundary';

const HomePage                    = lazy(() => import('./pages/HomePage'));
const EconomyPage                 = lazy(() => import('./pages/EconomyPage'));
const EconomyDetailPage           = lazy(() => import('./pages/EconomyDetailPage'));
const ContractsPage               = lazy(() => import('./pages/ContractsPage'));
const ContractDetailPage          = lazy(() => import('./pages/ContractDetailPage'));
const BalancesPage                = lazy(() => import('./pages/BalancesPage'));
const BalanceDetailPage           = lazy(() => import('./pages/BalanceDetailPage'));
const LoginPage                   = lazy(() => import('./pages/LoginPage'));
const AdminDashboard              = lazy(() => import('./pages/AdminDashboard'));
const AdminEconomyPage            = lazy(() => import('./pages/AdminEconomyPage'));
const AdminEconomyFormPage        = lazy(() => import('./pages/AdminEconomyFormPage'));
const AdminContractsPage          = lazy(() => import('./pages/AdminContractsPage'));
const AdminContractFormPage       = lazy(() => import('./pages/AdminContractFormPage'));
const AdminRightsPage             = lazy(() => import('./pages/AdminRightsPage'));
const AdminPlayersPage            = lazy(() => import('./pages/AdminPlayersPage'));
const AdminRightFormPage          = lazy(() => import('./pages/AdminRightFormPage'));
const AdminRumorsPage             = lazy(() => import('./pages/AdminRumorsPage'));
const AdminRumorFormPage          = lazy(() => import('./pages/AdminRumorFormPage'));
const AdminMarketsPage            = lazy(() => import('./pages/AdminMarketsPage'));
const AdminBalancesPage           = lazy(() => import('./pages/AdminBalancesPage'));
const AdminBalanceFormPage        = lazy(() => import('./pages/AdminBalanceFormPage'));
const AdminSettings               = lazy(() => import('./pages/AdminSettings'));
const AdminStadiumPage            = lazy(() => import('./pages/AdminStadiumPage'));
const AdminElectionsPage          = lazy(() => import('./pages/AdminElectionsPage'));
const AdminElectionListFormPage   = lazy(() => import('./pages/AdminElectionListFormPage'));
const StadiumPage                 = lazy(() => import('./pages/StadiumPage'));
const StatsPage                   = lazy(() => import('./pages/StatsPage'));
const RightsPage                  = lazy(() => import('./pages/RightsPage'));
const ElectionListPage            = lazy(() => import('./pages/ElectionListPage'));
const ElectionsPage               = lazy(() => import('./pages/ElectionsPage'));
const ElectionDetailPage          = lazy(() => import('./pages/ElectionDetailPage'));
const MyProposalsPage             = lazy(() => import('./pages/MyProposalsPage'));

function ScrollToTop() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    // Skip if navigating to home with a scroll target (Navbar handles that scroll)
    if (pathname === '/' && state?.scrollTo) return;
    window.scrollTo(0, 0);
  }, [pathname, state]);
  return null;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  usePageTracking();
  return (
    <Layout>
      <ScrollToTop />
      <ChunkErrorBoundary>
      <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/economia" element={<EconomyPage />} />
        <Route path="/economia/:id" element={<EconomyDetailPage />} />
        <Route path="/contratos" element={<ContractsPage />} />
        <Route path="/contratos/:id" element={<ContractDetailPage />} />
        <Route path="/balances" element={<BalancesPage />} />
        <Route path="/balances/:id" element={<BalanceDetailPage />} />
        <Route path="/estadisticas" element={<StatsPage />} />
        <Route path="/estadio" element={<StadiumPage />} />
        <Route path="/derechos" element={<RightsPage />} />
        <Route path="/elecciones" element={<ElectionsPage />} />
        <Route path="/elecciones/privado/:token" element={<ElectionListPage />} />
        <Route path="/elecciones/:slug" element={<ElectionDetailPage />} />
        <Route path="/mis-propuestas-2026" element={<MyProposalsPage />} />

        {/* Auth */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin (protected) */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/economia" element={<ProtectedRoute><AdminEconomyPage /></ProtectedRoute>} />
        <Route path="/admin/economia/nuevo" element={<ProtectedRoute><AdminEconomyFormPage /></ProtectedRoute>} />
        <Route path="/admin/economia/:id/editar" element={<ProtectedRoute><AdminEconomyFormPage /></ProtectedRoute>} />
        <Route path="/admin/contratos" element={<ProtectedRoute><AdminContractsPage /></ProtectedRoute>} />
        <Route path="/admin/contratos/nuevo" element={<ProtectedRoute><AdminContractFormPage /></ProtectedRoute>} />
        <Route path="/admin/contratos/:id/editar" element={<ProtectedRoute><AdminContractFormPage /></ProtectedRoute>} />
        <Route path="/admin/derechos" element={<ProtectedRoute><AdminRightsPage /></ProtectedRoute>} />
        <Route path="/admin/derechos/nuevo" element={<ProtectedRoute><AdminRightFormPage /></ProtectedRoute>} />
        <Route path="/admin/derechos/:id/editar" element={<ProtectedRoute><AdminRightFormPage /></ProtectedRoute>} />
        <Route path="/admin/jugadores" element={<ProtectedRoute><AdminPlayersPage /></ProtectedRoute>} />
        <Route path="/admin/rumores" element={<ProtectedRoute><AdminRumorsPage /></ProtectedRoute>} />
        <Route path="/admin/rumores/nuevo" element={<ProtectedRoute><AdminRumorFormPage /></ProtectedRoute>} />
        <Route path="/admin/rumores/:id/editar" element={<ProtectedRoute><AdminRumorFormPage /></ProtectedRoute>} />
        <Route path="/admin/mercados" element={<ProtectedRoute><AdminMarketsPage /></ProtectedRoute>} />
        <Route path="/admin/balances" element={<ProtectedRoute><AdminBalancesPage /></ProtectedRoute>} />
        <Route path="/admin/balances/nuevo" element={<ProtectedRoute><AdminBalanceFormPage /></ProtectedRoute>} />
        <Route path="/admin/balances/:id/editar" element={<ProtectedRoute><AdminBalanceFormPage /></ProtectedRoute>} />
        <Route path="/admin/configuracion" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/estadio" element={<ProtectedRoute><AdminStadiumPage /></ProtectedRoute>} />
        <Route path="/admin/elecciones" element={<ProtectedRoute><AdminElectionsPage /></ProtectedRoute>} />
        <Route path="/admin/elecciones/nuevo" element={<ProtectedRoute><AdminElectionListFormPage /></ProtectedRoute>} />
        <Route path="/admin/elecciones/:id/editar" element={<ProtectedRoute><AdminElectionListFormPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </ChunkErrorBoundary>
    </Layout>
  );
}
