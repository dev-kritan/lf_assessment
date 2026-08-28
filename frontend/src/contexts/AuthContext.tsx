import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth.api';
import { STORAGE_KEYS, CUSTOM_EVENTS } from '../constants';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<{ requiresTwoFactor?: boolean; userId?: number }>;
  register: (name: string, email: string, password: string) => Promise<{ user: User; message: string; verificationToken?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.data));
      } else {
        setUser(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch {
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const handleLogoutEvent = () => {
      setUser(null);
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    };

    window.addEventListener(CUSTOM_EVENTS.AUTH_LOGOUT, handleLogoutEvent);
    return () => window.removeEventListener(CUSTOM_EVENTS.AUTH_LOGOUT, handleLogoutEvent);
  }, [refreshProfile]);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    const res = await authApi.login({ email, password, twoFactorCode });
    if (res.data.requiresTwoFactor) {
      return { requiresTwoFactor: true, userId: res.data.userId };
    }

    if (res.data.user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return { requiresTwoFactor: false };
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    if (res.data.user && res.data.user.isEmailVerified) {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.data.user));
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Continue cleanup even if API fails
    } finally {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => ({}),
      register: async () => ({ user: {} as User, message: '' }),
      logout: async () => {},
      refreshProfile: async () => {},
      setUser: () => {},
    };
  }
  return context;
};
