import { type AuthResult, CivicAuth } from '@civic/auth/vanillajs';
import { useState, useEffect, useCallback } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState<AuthResult['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authClient, setAuthClient] = useState<CivicAuth | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await CivicAuth.create({
          loginUrl:
            'https://eth-warsaw-2025-monorepo-production.up.railway.app/auth/auth',
          displayMode: 'redirect',
        });
        setAuthClient(client);
      } catch (error) {
        console.error('Failed to initialize Civic Auth:', error);
      }
    };

    initAuth();
  }, []);

  const signIn = useCallback(async () => {
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
  }, [authClient]);

  const signOut = useCallback(async () => {
    if (!authClient) return;

    try {
      await authClient.logout();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [authClient]);
  return { user, isLoading, signIn, signOut };
};
