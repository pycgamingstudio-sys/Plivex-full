import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Simulating initial auth state check
    const checkAuth = async () => {
      try {
        setIsLoadingAuth(true);
        // Add auth initialization logic here
      } catch (err) {
        setAuthError(err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const bootstrapRole = async (currentUser) => {
    try {
      if (!currentUser) return 'user';
      // Role bootstrap logic based on user/invite code
      return 'admin';
    } catch (err) {
      console.error("Error bootstrapping role:", err);
      return 'user';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const signUp = async (email, password) => {
    // Sign up logic
  };

  const login = async (email, password) => {
    // Login logic
  };

  const logout = async () => {
    setUser(null);
  };

  const value = {
    user,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    bootstrapRole,
    navigateToLogin,
    signUp,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
