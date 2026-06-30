import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8000' });

// Attach token if present
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// Predictions (public)
export const predictInteraction = (data) => API.post('/predict/interaction', data);
export const searchDrugs = (q) => API.get(`/predict/drugs/search?q=${q}&limit=15`);

// User
export const getMe = () => API.get('/users/me');
export const updateMe = (data) => API.put('/users/me', data);
export const getMyHistory = (skip = 0, limit = 20) =>
  API.get(`/users/my-history?skip=${skip}&limit=${limit}`);

// Admin
export const adminGetUsers = () => API.get('/admin/users');
export const adminUpdateUser = (id, data) => API.put(`/admin/users/${id}`, data);
export const adminSuspendUser = (id) => API.post(`/admin/users/${id}/suspend`);
export const adminActivateUser = (id) => API.post(`/admin/users/${id}/activate`);
export const adminDeleteUser = (id) => API.delete(`/admin/users/${id}`);
export const adminGetStats = () => API.get('/admin/stats');
export const adminGetMetrics = () => API.get('/admin/metrics');
export const adminGetLogs = (limit = 100) => API.get(`/admin/logs?limit=${limit}`);
export const adminGetDatasetInfo = () => API.get('/admin/dataset/info');
export const adminUploadDataset = (formData) =>
  API.post('/admin/dataset/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default API;
