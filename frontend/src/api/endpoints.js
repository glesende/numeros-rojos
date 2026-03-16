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
export const getContract = (id) => client.get(`/contracts/${id}`);
export const createContract = (data) => client.post('/admin/contracts', data);
export const updateContract = (id, data) => client.put(`/admin/contracts/${id}`, data);
export const deleteContract = (id) => client.delete(`/admin/contracts/${id}`);

// Stats
export const getStandings = (params = {}) => client.get('/standings', { params });
export const getPlayerStats = (id) => client.get(`/player/${id}/stats`);
export const getLeagueStats = (params = {}) => client.get('/league/stats', { params });

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
export const createBalance = (data) => client.post('/admin/balances', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateBalance = (id, formData) => client.post(`/admin/balances/${id}/update`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteBalance = (id) => client.delete(`/admin/balances/${id}`);
export const analyzeBalance = (id) => client.post(`/admin/balances/${id}/analyze`);

// Balance breakdowns (admin)
export const createBreakdown = (balanceId, data) => client.post(`/admin/balances/${balanceId}/breakdowns`, data);
export const updateBreakdown = (balanceId, breakdownId, data) => client.put(`/admin/balances/${balanceId}/breakdowns/${breakdownId}`, data);
export const deleteBreakdown = (balanceId, breakdownId) => client.delete(`/admin/balances/${balanceId}/breakdowns/${breakdownId}`);

// Balance items (public + admin)
export const getBalanceItems = () => client.get('/balance-items');
export const createBalanceItem = (data) => client.post('/admin/balance-items', data);
export const updateBalanceItem = (id, data) => client.put(`/admin/balance-items/${id}`, data);
export const deleteBalanceItem = (id) => client.delete(`/admin/balance-items/${id}`);
export const createBalanceSubitem = (itemId, data) => client.post(`/admin/balance-items/${itemId}/subitems`, data);
export const updateBalanceSubitem = (itemId, subitemId, data) => client.put(`/admin/balance-items/${itemId}/subitems/${subitemId}`, data);
export const deleteBalanceSubitem = (itemId, subitemId) => client.delete(`/admin/balance-items/${itemId}/subitems/${subitemId}`);

// Auth
export const login = (credentials) => client.post('/auth/login', credentials);
export const getMe = () => client.get('/admin/me');
export const refreshToken = () => client.post('/admin/auth/refresh');
export const logout = () => client.post('/admin/auth/logout');
export const changePassword = (data) => client.post('/admin/auth/change-password', data);
