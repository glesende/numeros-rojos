import client from './client';

// Economy
export const getEconomyRecords = (params = {}) => client.get('/economy', { params });
export const getEconomyRecord = (id) => client.get(`/economy/${id}`);
export const getEconomyMonthlySummary = () => client.get('/economy/monthly-summary');
export const createEconomyRecord = (data) => client.post('/admin/economy', data);
export const updateEconomyRecord = (id, data) => client.put(`/admin/economy/${id}`, data);
export const deleteEconomyRecord = (id) => client.delete(`/admin/economy/${id}`);

// Contracts
export const getContracts = (params = {}) => client.get('/contracts', { params });
export const getContractStats = () => client.get('/contracts/stats');
export const getContract = (id) => client.get(`/contracts/${id}`);
export const createContract = (data) => client.post('/admin/contracts', data);
export const updateContract = (id, data) => client.put(`/admin/contracts/${id}`, data);
export const deleteContract = (id) => client.delete(`/admin/contracts/${id}`);

// Stats
export const getStandings = (params = {}) => client.get('/standings', { params });
export const getPlayerStats = (id) => client.get(`/player/${id}/stats`);
export const getLeagueStats = (params = {}) => client.get('/league/stats', { params });
export const getTeam = (params = {}) => client.get('/team', { params });
export const getPlayerMatches = (id) => client.get(`/player/${id}/matches`);

// Settings
export const getSettings = () => client.get('/admin/settings');
export const updateSettings = (data) => client.put('/admin/settings', data);
export const getSectionSettings = () => client.get('/settings/sections');

// Balances (public)
export const getBalances = () => client.get('/balances');
export const getBalance = (id) => client.get(`/balances/${id}`);
export const getBalancesEvolution = (params = {}) => client.get('/balances/evolution', { params });
export const getBalanceDownloadUrl = (id) => `${client.defaults.baseURL}/balances/${id}/download`;

// Balances (admin)
export const getBalanceAllItems = () => client.get('/admin/balances/items');
export const createBalance = (data) => client.post('/admin/balances', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateBalance = (id, formData) => client.post(`/admin/balances/${id}/update`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteBalance = (id) => client.delete(`/admin/balances/${id}`);
export const analyzeBalance = (id) => client.post(`/admin/balances/${id}/analyze`);
export const applyBalanceAnalysis = (id, data) => client.post(`/admin/balances/${id}/apply-analysis`, data);

// Balance lines CRUD (admin)
export const createLine = (balanceId, data) => client.post(`/admin/balances/${balanceId}/lines`, data);
export const reorderLines = (balanceId, items) => client.post(`/admin/balances/${balanceId}/lines/reorder`, { items });
export const updateLine = (balanceId, lineId, data) => client.put(`/admin/balances/${balanceId}/lines/${lineId}`, data);
export const deleteLine = (balanceId, lineId) => client.delete(`/admin/balances/${balanceId}/lines/${lineId}`);

// Stadium (public)
export const getStadium = () => client.get('/stadium');

// Stadium config (admin)
export const saveStadiumConfig = (data) => client.post('/admin/stadium/config', data);

// Stadium sectors (admin)
export const createStadiumSector = (data) => client.post('/admin/stadium/sectors', data);
export const updateStadiumSector = (id, data) => client.put(`/admin/stadium/sectors/${id}`, data);
export const deleteStadiumSector = (id) => client.delete(`/admin/stadium/sectors/${id}`);


// Contact
export const sendContact = (data) => client.post('/contact', data);

// Auth
export const login = (credentials) => client.post('/auth/login', credentials);
export const getMe = () => client.get('/admin/me');
export const refreshToken = () => client.post('/admin/auth/refresh');
export const logout = () => client.post('/admin/auth/logout');
export const changePassword = (data) => client.post('/admin/auth/change-password', data);
