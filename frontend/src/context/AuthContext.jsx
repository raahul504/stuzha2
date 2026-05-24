import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/authService';
import { setAuthenticatedState } from '../api/axios';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
      } catch (err) {
        // interceptor handles it
      }
    }, 13 * 60 * 1000); // 13 min, before 15 min expiry
    return () => clearInterval(interval);
  }, [user]);


  const checkAuth = async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data.user);
      // Tell the interceptor the user is authenticated so it can
      // redirect on session expiry — but only after a confirmed session
      setAuthenticatedState(true);
    } catch (error) {
      // Silently fail - user is not authenticated
      // Don't log errors for expected 401s
      // In Electron, network errors are expected if backend isn't running
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        console.warn('Backend server not available. Running in offline mode.');
      }
      setUser(null);
      setAuthenticatedState(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    // Mark as authenticated so the interceptor can redirect on future session expiry
    setAuthenticatedState(true);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    // Note: Registration doesn't auto-login, so user needs to login after
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      // Tell the interceptor the user is no longer authenticated
      setAuthenticatedState(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};