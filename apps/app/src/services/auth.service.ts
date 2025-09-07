import { apiClient } from './api';
import type { User } from '../types/api';

export const AuthService = {
  async logout(): Promise<void> {
    try {
      await apiClient.get('/auth/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  },

  async createUser({
    civicId,
    civicAddress,
    walletAddress,
    accessToken,
  }: {
    civicId: string;
    civicAddress: string;
    walletAddress: string;
    accessToken: string;
  }): Promise<User> {
    const response = await apiClient.post<User>(
      `/auth/auth/user?id=${encodeURIComponent(
        civicId
      )}&walletAddress=${encodeURIComponent(
        walletAddress
      )}&civicWalletAddress=${encodeURIComponent(civicAddress)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to create user');
    }

    return response.data;
  },

  async getCurrentUser(accessToken: string): Promise<User | null> {
    try {
      const response = await apiClient.get('/auth/auth/user/current', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.success && response.data) {
        return response.data as User;
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
};
