import { type AuthResult, CivicAuth } from '@civic/auth/vanillajs';
import { useState, useEffect } from 'react';

const client = await CivicAuth.create({
  loginUrl:
    'https://eth-warsaw-2025-monorepo-production.up.railway.app/auth/auth',
  logging: {
    enabled: true,
    level: 'debug',
  },
  backendEndpoints: {
    user: 'https://eth-warsaw-2025-monorepo-production.up.railway.app/auth/auth/session',
  },
  displayMode: 'iframe',
});

export const useAuth = () => {
  const [user, setUser] = useState<AuthResult['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentCivicUser = await client.getCurrentUser();
        console.log('currentCivicUser', currentCivicUser);
        if (currentCivicUser) {
          setUser(currentCivicUser);
        }
      } catch (error) {
        console.error('Failed to initialize Civic Auth:', error);
      }
    };

    initAuth();
  }, []);

  const signIn = async () => {
    try {
      setIsLoading(true);
      const { user: civicUser, signalText } =
        await client.startAuthentication();
      console.log({ authCivicUser: civicUser });
      console.log({ signalText });
      setUser(civicUser);
    } catch (error) {
      console.error('Sign in failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await client.logout();
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };
  return { user, isLoading, signIn, signOut };
};
