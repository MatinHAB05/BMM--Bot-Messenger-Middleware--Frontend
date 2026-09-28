import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/user';
import { Company } from '../types/company';
import { LoginRequest, TokenPair } from '../types/auth';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { companiesApi } from '../api/companies';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest | TokenPair) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCompany: React.Dispatch<React.SetStateAction<Company | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfileAndCompany = useCallback(async () => {
    try {
      const [userData, companyData] = await Promise.all([
        usersApi.getMe(),
        companiesApi.getMe(),
      ]);
      setUser(userData);
      setCompany(companyData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('company', JSON.stringify(companyData));
    } catch (err) {
      console.error('Failed to load user or company profile:', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      setUser(null);
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetchProfileAndCompany();
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setCompany(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchProfileAndCompany]);

  const login = async (payload: LoginRequest | TokenPair): Promise<void> => {
    setIsLoading(true);
    try {
      let tokens: TokenPair;
      if ('access_token' in payload) {
        tokens = payload;
      } else {
        tokens = await authApi.login(payload);
      }
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);

      await fetchProfileAndCompany();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API notification failed, clearing local session anyway', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      setUser(null);
      setCompany(null);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    await fetchProfileAndCompany();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
        refreshUser: refreshProfile,
        refreshCompany: refreshProfile,
        setUser,
        setCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
