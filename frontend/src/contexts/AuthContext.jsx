import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    getMe()
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const register = useCallback(async (email, password) => {
    const res = await apiRegister(email, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await getMe();
    setUser(res.data);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
