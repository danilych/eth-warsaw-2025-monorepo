import { apiClient } from './api';
import type { User } from '../types/api';

export const AuthService = {
  /**
   * Get login URL from backend
   */
  async getLoginUrl(): Promise<string> {
    const response = await apiClient.get<{ loginUrl: string }>('/auth/auth/login-url');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to get login URL');
    }
    
    return response.data.loginUrl;
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
   * Get current authenticated user from session
   */
  async getCurrentUser(): Promise<any | null> {
    try {
      // This will be handled by checking session cookies
      // The backend will validate the session and return user info
      const response = await apiClient.get('/auth/auth/user');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
};
