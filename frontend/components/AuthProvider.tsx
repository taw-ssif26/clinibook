'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tokenStore } from '../lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (access: string, refresh: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if token exists on mount
    const token = tokenStore.getAccess();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (access: string, refresh: string, role: string) => {
    tokenStore.set(access, refresh);
    if (typeof window !== 'undefined') localStorage.setItem('clinibook_role', role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    tokenStore.clear();
    if (typeof window !== 'undefined') localStorage.removeItem('clinibook_role');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
