import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, TOKEN_KEY, USER_KEY } from '../api';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw && localStorage.getItem(TOKEN_KEY) ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  const persist = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return persist(data);
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return persist(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    window.addEventListener('cmn:logout', logout);
    return () => window.removeEventListener('cmn:logout', logout);
  }, [logout]);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
