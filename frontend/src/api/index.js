import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register       = (email, password) => api.post('/api/auth/register', { email, password });
export const login          = (email, password) => api.post('/api/auth/login',    { email, password });
export const getMe          = ()       => api.get('/api/auth/me');
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
