import React, { createContext, useContext, useEffect, useState } from 'react';
import { CivicAuthProvider, useUser } from '@civic/auth-web3/react';
import { AuthService } from '../services/auth.service';
import type { User } from '../types/api';

interface AuthContextType {
  user: any | null;
  dbUser: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setDbUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  clientId: string;
}

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { user, signIn, signOut, isLoading } = useUser();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Auto-check if user has wallet and create user record when authenticated
  useEffect(() => {
    if (user && !dbUser && !isCreatingUser) {
      // Check if user already has a wallet
      if ('ethereum' in user && user.ethereum) {
        const walletAddress = (user.ethereum as { address: string }).address;
        if (walletAddress) {
          setIsCreatingUser(true);
          AuthService.createUser(user.id, walletAddress)
            .then((createdUser) => {
              setDbUser(createdUser);
            })
            .catch((error) => {
              console.error('Failed to create user with wallet:', error);
            })
            .finally(() => {
              setIsCreatingUser(false);
            });
        }
      }
    }
  }, [user, dbUser, isCreatingUser]);

  const value: AuthContextType = {
    user,
    dbUser,
    isLoading: isLoading || isCreatingUser,
    signIn,
    signOut,
    setDbUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children, clientId }: AuthProviderProps) {
  return (
    <CivicAuthProvider
      clientId={clientId}
      redirectUrl="https://eth-warsaw-2025-monorepo-production.up.railway.app/auth/auth/callback"
      displayMode="redirect"
    >
      <AuthProviderInner>{children}</AuthProviderInner>
    </CivicAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
