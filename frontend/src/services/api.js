import axios from 'axios';

// In production (Vercel), uses REACT_APP_API_URL env var
// In local dev, uses the proxy defined in package.json → http://localhost:8080
const API_BASE = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

const WS_BASE = process.env.REACT_APP_WS_URL || 'http://localhost:8084';
export { WS_BASE };

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401 only for authenticated routes (not auth endpoints)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, fullName) => api.post('/auth/register', { email, password, fullName }),
};

export const diagnosisApi = {
  predict: (diseaseType, features) => api.post('/diagnosis/predict', { diseaseType, features }),
  predictImage: (file, diseaseType = 'chest_xray') => {
    const form = new FormData();
    form.append('file', file);
    form.append('diseaseType', diseaseType);
    return api.post('/diagnosis/predict/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const patientApi = {
  getProfile: () => api.get('/patients/me'),
  updateProfile: (data) => api.put('/patients/me', data),
  getHistory: (diseaseType) =>
    api.get('/patients/me/history', { params: diseaseType ? { diseaseType } : {} }),
  getSummary: () => api.get('/patients/me/history/summary'),
};

export default api;
