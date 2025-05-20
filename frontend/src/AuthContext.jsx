// src/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin } from './api/auth';
import axios                  from 'axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Pull from sessionStorage so tabs share only within same session
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [user, setUser]   = useState(() => {
    const json = sessionStorage.getItem('user');
    return json ? JSON.parse(json) : null;
  });

  // Immediately (synchronously) apply token to axios
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // When token changes, keep sessionStorage + axios header in sync
  useEffect(() => {
    if (token) {
      sessionStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      sessionStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // When user object changes, sync to sessionStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user');
    }
  }, [user]);

  // Login action: call API, store token+user
  const login = async (identifier, password) => {
    const { token: jwt, user } = await apiLogin({ identifier, password });
    setToken(jwt);
    setUser(user);
  };

  // Logout action: clear both
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
