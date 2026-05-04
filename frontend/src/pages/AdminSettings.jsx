import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { changePassword, getSettings, updateSettings } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';

const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
];

export default function AdminSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [dataService, setDataService] = useState('disabled');
  const [besoccerApiKey, setBesoccerApiKey] = useState('');
  const [besoccerTeamId, setBesoccerTeamId] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');
  const [serviceLoading, setServiceLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [openaiError, setOpenaiError] = useState('');
  const [openaiSuccess, setOpenaiSuccess] = useState('');
  const [openaiLoading, setOpenaiLoading] = useState(false);

  const [chartScaleUsd, setChartScaleUsd] = useState('');
  const [chartScaleEur, setChartScaleEur] = useState('');
  const [chartScaleArs, setChartScaleArs] = useState('');
  const [chartScaleError, setChartScaleError] = useState('');
  const [chartScaleSuccess, setChartScaleSuccess] = useState('');
  const [chartScaleLoading, setChartScaleLoading] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getSettings()
      .then((res) => {
        const data = res.data?.data || {};
        setDataService(data.data_service || 'disabled');
        setBesoccerApiKey(data.besoccer_api_key || '');
        setBesoccerTeamId(data.besoccer_team_id || '');
        setOpenaiApiKey(data.openai_api_key || '');
        setOpenaiModel(data.openai_model || 'gpt-4o');
        setChartScaleUsd(data.chart_scale_usd ?? '');
        setChartScaleEur(data.chart_scale_eur ?? '');
        setChartScaleArs(data.chart_scale_ars ?? '');
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
        payload.besoccer_team_id = besoccerTeamId;
      }
      await updateSettings(payload);
      setServiceSuccess('Configuración guardada correctamente');
    } catch (err) {
      setServiceError(err.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setServiceLoading(false);
    }
  };

  const handleChartScaleSubmit = async (e) => {
    e.preventDefault();
    setChartScaleError('');
    setChartScaleSuccess('');
    setChartScaleLoading(true);
    try {
      await updateSettings({
        chart_scale_usd: chartScaleUsd === '' ? null : Number(chartScaleUsd),
        chart_scale_eur: chartScaleEur === '' ? null : Number(chartScaleEur),
        chart_scale_ars: chartScaleArs === '' ? null : Number(chartScaleArs),
      });
      setChartScaleSuccess('Escalas guardadas correctamente');
    } catch (err) {
      setChartScaleError(err.response?.data?.error || 'Error al guardar las escalas');
    } finally {
      setChartScaleLoading(false);
    }
  };

  const handleOpenaiSubmit = async (e) => {
    e.preventDefault();
    setOpenaiError('');
    setOpenaiSuccess('');
    setOpenaiLoading(true);
    try {
      await updateSettings({ openai_api_key: openaiApiKey, openai_model: openaiModel });
      setOpenaiSuccess('Configuración de OpenAI guardada correctamente');
    } catch (err) {
      setOpenaiError(err.response?.data?.error || 'Error al guardar la configuración de OpenAI');
    } finally {
      setOpenaiLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin" className="text-rojo text-sm hover:underline">&larr; Admin</Link>
        <h1 className="text-2xl font-extrabold">Configuracion</h1>
      </div>

      {/* Data service */}
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
              <>
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
                <div>
                  <label className="block text-sm font-medium mb-1">ID del equipo destacado</label>
                  <input
                    type="text"
                    value={besoccerTeamId}
                    onChange={(e) => setBesoccerTeamId(e.target.value)}
                    className="input-field w-full"
                    placeholder="Ej: 1373"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Se usa para resaltar el equipo en las tablas de estadísticas.
                  </p>
                </div>
              </>
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

      {/* OpenAI configuration */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-1">Inteligencia Artificial (OpenAI)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Necesario para el análisis automático de balances. Configurá tu API Key de OpenAI.
        </p>

        {!settingsLoaded ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <form onSubmit={handleOpenaiSubmit} className="space-y-4">
            {openaiError && <ErrorMessage message={openaiError} />}
            {openaiSuccess && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                {openaiSuccess}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">API Key de OpenAI</label>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="input-field w-full"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Modelo</label>
              <select
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="input-field w-full"
              >
                {OPENAI_MODELS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Se recomienda gpt-4o para mejor análisis de documentos.
              </p>
            </div>

            <button
              type="submit"
              disabled={openaiLoading}
              className="btn-primary w-full"
            >
              {openaiLoading ? 'Guardando...' : 'Guardar configuración OpenAI'}
            </button>
          </form>
        )}
      </div>

      {/* Chart scale settings */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-1">Escala del gráfico económico</h2>
        <p className="text-sm text-gray-500 mb-4">
          Divisor para normalizar cada moneda en el gráfico de compromisos. Dejá vacío para mostrar el valor sin escalar.
        </p>

        {!settingsLoaded ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <form onSubmit={handleChartScaleSubmit} className="space-y-4">
            {chartScaleError && <ErrorMessage message={chartScaleError} />}
            {chartScaleSuccess && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                {chartScaleSuccess}
              </div>
            )}

            {[
              { label: 'Divisor USD', value: chartScaleUsd, setter: setChartScaleUsd, placeholder: 'Sin escala' },
              { label: 'Divisor EUR', value: chartScaleEur, setter: setChartScaleEur, placeholder: 'Sin escala' },
              { label: 'Divisor ARS', value: chartScaleArs, setter: setChartScaleArs, placeholder: 'Sin escala' },
            ].map(({ label, value, setter, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type="number"
                  min="0.0001"
                  step="any"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="input-field w-full"
                  placeholder={placeholder}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={chartScaleLoading}
              className="btn-primary w-full"
            >
              {chartScaleLoading ? 'Guardando...' : 'Guardar escalas'}
            </button>
          </form>
        )}
      </div>

      {/* Change password */}
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
