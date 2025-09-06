import React, { createContext, useContext, useEffect, useState } from 'react';
import { CivicAuth } from '@civic/auth/vanillajs';
import { AuthService } from '../services/auth.service';
import type { User } from '../types/api';

interface AuthContextType {
  user: any | null;
  dbUser: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setDbUser: (user: User | null) => void;
  setUser: (user: any | null) => void;
  setIsLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<any | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authClient, setAuthClient] = useState<any>(null);

  // Initialize Civic Auth client
  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await CivicAuth.create({
          loginUrl: `https://eth-warsaw-2025-monorepo-production.up.railway.app/auth/auth/`,
          logging: { enabled: true },
        });
        setAuthClient(client);
      } catch (error) {
        console.error('Failed to initialize Civic Auth:', error);
      }
    };

    initAuth();
  }, []);

  const signIn = async () => {
    if (!authClient) return;

    try {
      setIsLoading(true);
      const { user: civicUser } = await authClient.startAuthentication();
      setUser(civicUser);
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setDbUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const value = {
    user,
    dbUser,
    isLoading,
    signIn,
    signOut,
    setDbUser,
    setUser,
    setIsLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
