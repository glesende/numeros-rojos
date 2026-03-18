import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import EconomyPage from './pages/EconomyPage';
import EconomyDetailPage from './pages/EconomyDetailPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import BalancesPage from './pages/BalancesPage';
import BalanceDetailPage from './pages/BalanceDetailPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminEconomyPage from './pages/AdminEconomyPage';
import AdminEconomyFormPage from './pages/AdminEconomyFormPage';
import AdminContractsPage from './pages/AdminContractsPage';
import AdminContractFormPage from './pages/AdminContractFormPage';
import AdminBalancesPage from './pages/AdminBalancesPage';
import AdminBalanceFormPage from './pages/AdminBalanceFormPage';
import AdminSettings from './pages/AdminSettings';
import AdminStadiumPage from './pages/AdminStadiumPage';
import AdminMatchFormPage from './pages/AdminMatchFormPage';
import StadiumPage from './pages/StadiumPage';
import StatsPage from './pages/StatsPage';
import Loader from './components/common/Loader';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Layout>
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
        <Route path="/admin/balances" element={<ProtectedRoute><AdminBalancesPage /></ProtectedRoute>} />
        <Route path="/admin/balances/nuevo" element={<ProtectedRoute><AdminBalanceFormPage /></ProtectedRoute>} />
        <Route path="/admin/balances/:id/editar" element={<ProtectedRoute><AdminBalanceFormPage /></ProtectedRoute>} />
        <Route path="/admin/configuracion" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/estadio" element={<ProtectedRoute><AdminStadiumPage /></ProtectedRoute>} />
        <Route path="/admin/estadio/partidos/nuevo" element={<ProtectedRoute><AdminMatchFormPage /></ProtectedRoute>} />
        <Route path="/admin/estadio/partidos/:id/editar" element={<ProtectedRoute><AdminMatchFormPage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
