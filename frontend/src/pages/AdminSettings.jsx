import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { changePassword } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';

export default function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess('Contraseña actualizada correctamente');
      setTimeout(() => {
        logout();
        navigate('/admin/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="text-rojo text-sm hover:underline">&larr; Admin</Link>
        <h1 className="text-2xl font-extrabold">Configuracion</h1>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Cambiar contrasena</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Contrasena actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Nueva contrasena</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field w-full"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirmar nueva contrasena</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field w-full"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Cambiando...' : 'Cambiar contrasena'}
          </button>
        </form>
      </div>
    </div>
  );
}
