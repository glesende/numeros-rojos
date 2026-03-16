import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { changePassword, getSettings, updateSettings } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';

export default function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [dataService, setDataService] = useState('disabled');
  const [besoccerApiKey, setBesoccerApiKey] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getSettings()
      .then((res) => {
        const data = res.data?.data || {};
        setDataService(data.data_service || 'disabled');
        setBesoccerApiKey(data.besoccer_api_key || '');
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, []);

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

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    setServiceError('');
    setServiceSuccess('');
    setServiceLoading(true);
    try {
      const payload = { data_service: dataService };
      if (dataService === 'besoccer') {
        payload.besoccer_api_key = besoccerApiKey;
      }
      await updateSettings(payload);
      setServiceSuccess('Configuración guardada correctamente');
    } catch (err) {
      setServiceError(err.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setServiceLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="text-rojo text-sm hover:underline">&larr; Admin</Link>
        <h1 className="text-2xl font-extrabold">Configuracion</h1>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-4">Servicio de datos</h2>

        {!settingsLoaded ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <form onSubmit={handleServiceSubmit} className="space-y-4">
            {serviceError && <ErrorMessage message={serviceError} />}
            {serviceSuccess && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                {serviceSuccess}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Servicio</label>
              <select
                value={dataService}
                onChange={(e) => setDataService(e.target.value)}
                className="input-field w-full"
              >
                <option value="disabled">Desactivado</option>
                <option value="besoccer">BeSoccer</option>
              </select>
            </div>

            {dataService === 'besoccer' && (
              <div>
                <label className="block text-sm font-medium mb-1">API Key de BeSoccer</label>
                <input
                  type="text"
                  value={besoccerApiKey}
                  onChange={(e) => setBesoccerApiKey(e.target.value)}
                  className="input-field w-full"
                  placeholder="Introduce la API Key"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={serviceLoading}
              className="btn-primary w-full"
            >
              {serviceLoading ? 'Guardando...' : 'Guardar configuracion'}
            </button>
          </form>
        )}
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
