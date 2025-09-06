import { apiClient } from './api';
import type { User, CivicUser } from '../types/api';

export const AuthService = {
  /**
   * Redirect to Civic Auth login
   */
  async login(): Promise<void> {
    window.location.href = `${
      process.env.VITE_API_BASE_URL || 'http://localhost:3000'
    }/auth/auth`;
  },

  /**
   * Logout user and redirect
   */
  async logout(): Promise<void> {
    try {
      await apiClient.get('/auth/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, redirect to clear local state
      window.location.href = '/';
    }
  },

  /**
   * Create or update user with wallet address after Civic auth
   */
  async createUser(civicId: string, walletAddress: string): Promise<User> {
    const response = await apiClient.post<User>(
      `/auth/auth/user?id=${encodeURIComponent(
        civicId
      )}&walletAddress=${encodeURIComponent(walletAddress)}`
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to create user');
    }

    return response.data;
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<CivicUser | null> {
    try {
      // This would be handled by Civic Auth context
      // For now, return null - will be implemented with Civic provider
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
};
