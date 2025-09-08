import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { login as apiLogin, getMe, refresh, TokenResponse, UserMe } from '../lib/api';

interface AuthContextValue {
  user: UserMe | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserMe | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    const stored = localStorage.getItem('authToken');
    const storedRefresh = localStorage.getItem('refreshToken');
    if (!stored || !storedRefresh) { setLoading(false); return; }
    try {
      const me = await getMe(stored);
      setUser(me);
      setToken(stored);
      setRefreshToken(storedRefresh);
    } catch {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
  const res: TokenResponse = await apiLogin(email, password);
  localStorage.setItem('authToken', res.access_token);
  localStorage.setItem('refreshToken', res.refresh_token);
      setToken(res.access_token);
  setRefreshToken(res.refresh_token);
      const me = await getMe(res.access_token);
      setUser(me);
    } finally { setLoading(false); }
  };

  const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  setUser(null); setToken(null); setRefreshToken(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const me = await getMe(token);
      setUser(me);
    } catch {}
  };

  // Schedule refresh ~1 minute before expiry if we have token + refresh token
  useEffect(() => {
    if (!token || !refreshToken) return;
    const DEFAULT_EXP = 3600; // seconds (fallback)
    // Without decoding JWT, assume configured ACCESS_TOKEN_TTL
    const refreshDelay = (DEFAULT_EXP - 60) * 1000; // ms
    const id = setTimeout(async () => {
      try {
        const res = await refresh(refreshToken);
        localStorage.setItem('authToken', res.access_token);
        localStorage.setItem('refreshToken', res.refresh_token);
        setToken(res.access_token);
        setRefreshToken(res.refresh_token);
        await refreshUser();
      } catch {
        logout();
      }
    }, refreshDelay);
    return () => clearTimeout(id);
  }, [token, refreshToken, refreshUser]);

  return (
  <AuthContext.Provider value={{ user, token, refreshToken, loading, login, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
