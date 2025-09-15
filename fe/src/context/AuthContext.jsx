import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in when app starts
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Restored user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Invalid user data in localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  // Debug user state changes
  useEffect(() => {
    console.log('User state changed:', user);
  }, [user]);

  const login = (userData, token) => {
    console.log('AuthContext.login called with:', userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    console.log('User state updated to:', userData);
  };

  const logout = () => {
    console.log('Logout called - clearing all auth data');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Clear any other stored auth data
    sessionStorage.clear();

    // Force reload to ensure clean state
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  const isAuthenticated = () => {
    const hasUser = !!user;
    const hasToken = !!localStorage.getItem('token');
    const result = hasUser && hasToken;

    console.log('isAuthenticated check:', {
      hasUser,
      hasToken,
      result,
      user: user?.hoten || 'No user',
    });

    return result;
  };

  const isAdmin = () => {
    console.log('isAdmin check:', {
      user: user,
      tenvaitro: user?.tenvaitro,
      mavaitro: user?.mavaitro,
      result: user?.tenvaitro === 'admin' || user?.mavaitro === 1,
    });

    if (!user) return null;
    // Check both tenvaitro and mavaitro for admin
    return user.tenvaitro === 'admin' || user.mavaitro === 1;
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
