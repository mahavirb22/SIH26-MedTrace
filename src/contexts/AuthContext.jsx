import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'medtrace_access_token';
const REFRESH_KEY = 'medtrace_refresh_token';
const USER_KEY = 'medtrace_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  const saveAuth = useCallback((userData, accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  /**
   * Login with email + password.
   * @returns {{ user, accessToken }} on success
   * @throws {Error} on failure
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      saveAuth(data.user, data.accessToken, data.refreshToken);
      return data;
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  /**
   * Register a new account.
   */
  const register = useCallback(async ({ email, password, name, role, phone, storeId }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, phone, storeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      saveAuth(data.user, data.accessToken, data.refreshToken);
      return data;
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  /**
   * Logout — clear tokens and user state.
   */
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  /**
   * Make an authenticated API request.
   * Automatically attaches Bearer token and handles 401 refresh.
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(url, { ...options, headers });

    // If 401, try refreshing the token
    if (res.status === 401 && token) {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (refreshToken) {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem(TOKEN_KEY, refreshData.accessToken);
          localStorage.setItem(REFRESH_KEY, refreshData.refreshToken);

          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          res = await fetch(url, { ...options, headers });
        } else {
          // Refresh failed — force logout
          clearAuth();
        }
      }
    }

    return res;
  }, [getToken, clearAuth]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    authFetch,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * @returns {{ user, loading, isAuthenticated, login, register, logout, authFetch, getToken }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
