import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await client.get('/users/profile/');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch profile', error);
      logout();
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await client.post('/users/login/', { email, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    setUser(response.data.user);
    try {
      const profile = await client.get('/users/profile/');
      setUser(profile.data);
      return profile.data;
    } catch {
      return response.data.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const changePassword = async (oldPassword, newPassword) => {
    await client.put('/users/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    try {
      const profile = await client.get('/users/profile/');
      setUser(profile.data);
    } catch {
      setUser((prev) => prev ? { ...prev, must_change_password: false } : null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
