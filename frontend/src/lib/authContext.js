'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const savedToken = localStorage.getItem('edubot_token');
    const savedUser = localStorage.getItem('edubot_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with /api/auth/me
        apiFetch('/auth/me')
          .then((res) => {
            if (res.success && res.user) {
              setUser(res.user);
              localStorage.setItem('edubot_user', JSON.stringify(res.user));
            }
          })
          .catch(() => {
            // Token might be expired
            logout();
          })
          .finally(() => setLoading(false));
      } catch (e) {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('edubot_token', res.token);
      localStorage.setItem('edubot_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('edubot_token', res.token);
      localStorage.setItem('edubot_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('edubot_token');
    localStorage.removeItem('edubot_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
