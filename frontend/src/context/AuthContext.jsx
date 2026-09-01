"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Request OTP code
   */
  const requestOtp = async (phone) => {
    try {
      const res = await api.post('/auth/send-otp', { phone });
      toast.success(res.data.message || 'OTP sent successfully!');
      return res.data;
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to send OTP';
      toast.error(errMsg);
      throw error;
    }
  };

  /**
   * Verify OTP and Login / Register user
   */
  const login = async (phone, otp, name) => {
    try {
      const res = await api.post('/auth/verify-otp', { phone, otp, name });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      
      toast.success(`Welcome back, ${user.name}!`);
      return user;
    } catch (error) {
      const errMsg = error.response?.data?.error || 'OTP verification failed';
      toast.error(errMsg);
      throw error;
    }
  };

  /**
   * Mock Google SSO Login
   */
  const loginWithGoogle = async (email, name) => {
    try {
      const res = await api.post('/auth/google-sso', { email, name });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      
      toast.success(`Welcome back, ${user.name}!`);
      return user;
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Google SSO Sign-in failed';
      toast.error(errMsg);
      throw error;
    }
  };

  /**
   * Login with Email and Password
   */
  const loginWithEmail = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      
      toast.success(`Welcome back, ${user.name}!`);
      return user;
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Login failed';
      toast.error(errMsg);
      throw error;
    }
  };

  /**
   * Register with Email and Password
   */
  const registerWithEmail = async (name, email, phone, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, phone, password });
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      
      toast.success(`Account registered successfully! Welcome, ${user.name}!`);
      return user;
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Registration failed';
      toast.error(errMsg);
      throw error;
    }
  };

  /**
   * Logout user and flush session data
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  /**
   * Update User Profile
   */
  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/auth/profile', profileData);
      const updatedUser = { ...user, ...res.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('Profile updated!');
      return updatedUser;
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Profile update failed';
      toast.error(errMsg);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    isLoggedIn: !!token,
    role: user?.role || 'user',
    requestOtp,
    login,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
