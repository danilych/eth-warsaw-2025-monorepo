import { apiClient } from './api';

export interface LeaderboardEntry {
  userId: string;
  walletAddress: string;
  balance: string;
  rank: number;
  lastUpdated: number;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalUsers: number;
  lastCalculated: number;
  validUntilBlock: number;
}

export interface UserPosition {
  rank: number;
  balance: string;
  totalUsers: number;
}

export interface LeaderboardStats {
  totalUsers: number;
  totalBalance: string;
  averageBalance: string;
}

export const LeaderboardService = {
  /**
   * Get leaderboard data (top 25 users)
   */
  async getLeaderboard(forceRefresh = false): Promise<LeaderboardData> {
    const endpoint = forceRefresh ? '/leaderboard?forceRefresh=true' : '/leaderboard';
    const response = await apiClient.get<LeaderboardData>(endpoint);
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch leaderboard');
    }
    
    return response.data;
  },

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(): Promise<LeaderboardStats> {
    const response = await apiClient.get<LeaderboardStats>('/leaderboard/stats');
    
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch leaderboard statistics');
    }
    
    return response.data;
  },

  /**
   * Get current user's position in leaderboard
   */
  async getCurrentUserPosition(): Promise<UserPosition | null> {
    try {
      const response = await apiClient.get<UserPosition>('/leaderboard/me');
      
      if (!response.success || !response.data) {
        return null; // User not in top 25
      }
      
      return response.data;
    } catch {
      // If user is not in leaderboard or not authenticated, return null
      return null;
    }
  },

  /**
   * Get specific user's position in leaderboard
   */
  async getUserPosition(userId: string): Promise<UserPosition | null> {
    try {
      const response = await apiClient.get<UserPosition>(`/leaderboard/user/${userId}`);
      
      if (!response.success || !response.data) {
        return null; // User not in top 25
      }
      
      return response.data;
    } catch {
      // If user is not in leaderboard, return null
      return null;
    }
  },

  /**
   * Format balance from string to readable format
   */
  formatBalance(balance: string): string {
    const balanceNumber = Number.parseFloat(balance);
    const ethAmount = balanceNumber / (10 ** 18);
    return ethAmount.toFixed(4);
  },

  /**
   * Get rank display with suffix (1st, 2nd, 3rd, etc.)
   */
  getRankDisplay(rank: number): string {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const v = rank % 100;
    return rank + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
  }
};
