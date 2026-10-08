import axios from 'axios';

const getInitialBaseUrl = () => {
  return localStorage.getItem('custom_api_url') || import.meta.env.VITE_API_URL || 'http://localhost:4000';
};

const api = axios.create({
  baseURL: getInitialBaseUrl(),
});

// Attach JWT and dynamic server URL to every request
api.interceptors.request.use((config) => {
  const custom = localStorage.getItem('custom_api_url');
  if (custom) {
    config.baseURL = custom;
  }
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setCustomApiUrl = (url) => {
  if (url) {
    localStorage.setItem('custom_api_url', url);
    api.defaults.baseURL = url;
  } else {
    localStorage.removeItem('custom_api_url');
    api.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  }
};

// Auth
export const register       = (email, password) => api.post('/api/auth/register', { email, password });
export const login          = (email, password) => api.post('/api/auth/login',    { email, password });
export const getMe          = ()       => api.get('/api/me');
export const updateProfile    = (data)   => api.put('/api/auth/profile', data);
export const forgotPassword  = (email)  => api.post('/api/auth/forgot-password', { email });

export const verifyOtp      = (email, otp)      => api.post('/api/auth/verify-otp', { email, otp });
export const resetPassword  = (email, otp, newPassword) => api.post('/api/auth/reset-password', { email, otp, newPassword });


// Tasks
export const getTasks    = (params)   => api.get('/api/tasks', { params });
export const createTask  = (data)     => api.post('/api/tasks', data);
export const updateTask  = (id, data) => api.patch(`/api/tasks/${id}`, data);
export const deleteTask  = (id)       => api.delete(`/api/tasks/${id}`);

// Chat
export const sendChat          = (message) => api.post('/api/chat', { message });
export const getChatHistory    = ()        => api.get('/api/chat/history');
export const batchCreateTasks  = (tasks)   => api.post('/api/chat/batch-create', { tasks });


// Push
export const subscribePush   = (sub)  => api.post('/api/push/subscribe', sub);
export const unsubscribePush = (endpoint) => api.delete('/api/push/unsubscribe', { data: { endpoint } });

export default api;
