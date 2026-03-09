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

// Auth
export const login = (credentials) => client.post('/auth/login', credentials);
export const getMe = () => client.get('/admin/me');
export const refreshToken = () => client.post('/admin/auth/refresh');
export const logout = () => client.post('/admin/auth/logout');
