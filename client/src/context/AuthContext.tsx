import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
  isFarmer: boolean;
  isBuyer: boolean;
  isSupplier: boolean;
  isMachineryOwner: boolean;
  isTransportProvider: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('gen_baazar_token');
    const savedUser = localStorage.getItem('gen_baazar_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        localStorage.removeItem('gen_baazar_token');
        localStorage.removeItem('gen_baazar_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (jwtToken: string, userData: User) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('gen_baazar_token', jwtToken);
    localStorage.setItem('gen_baazar_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('gen_baazar_token');
    localStorage.removeItem('gen_baazar_user');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('gen_baazar_user', JSON.stringify(userData));
  };

  const isAuthenticated = !!token && !!user;
  const isFarmer = user?.role === 'farmer';
  const isBuyer = user?.role === 'buyer';
  const isSupplier = user?.role === 'supplier';
  const isMachineryOwner = user?.role === 'machinery_owner';
  const isTransportProvider = user?.role === 'transport_provider';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
        isFarmer,
        isBuyer,
        isSupplier,
        isMachineryOwner,
        isTransportProvider,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

