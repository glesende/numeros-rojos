import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import EconomyPage from './pages/EconomyPage';
import EconomyDetailPage from './pages/EconomyDetailPage';
import ContractsPage from './pages/ContractsPage';
import ContractDetailPage from './pages/ContractDetailPage';
import StatsPage from './pages/StatsPage';
import MethodologyPage from './pages/MethodologyPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminEconomyPage from './pages/AdminEconomyPage';
import AdminEconomyFormPage from './pages/AdminEconomyFormPage';
import AdminContractsPage from './pages/AdminContractsPage';
import AdminContractFormPage from './pages/AdminContractFormPage';
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
        <Route path="/rendimiento" element={<StatsPage />} />
        <Route path="/metodologia" element={<MethodologyPage />} />

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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
