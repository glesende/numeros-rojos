import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const normalizeLinks = (links) => {
  if (!links) return links;
  if (typeof links === 'string') {
    try { links = JSON.parse(links); } catch { return []; }
  }
  if (!Array.isArray(links)) return [];
  return links.map((l) =>
    typeof l === 'string' ? { url: l, official: false } : { ...l, official: !!l.official }
  );
};

const normalizeRecord = (record) => {
  if (record && typeof record === 'object' && 'links' in record) {
    return { ...record, links: normalizeLinks(record.links) };
  }
  return record;
};

const normalizeResponse = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeRecord);
  const result = { ...data };
  if (Array.isArray(result.data)) result.data = result.data.map(normalizeRecord);
  else if (result.data && typeof result.data === 'object') result.data = normalizeRecord(result.data);
  return result;
};

client.interceptors.response.use(
  (response) => {
    if (response.data) response.data = normalizeResponse(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default client;
