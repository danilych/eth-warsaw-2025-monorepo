import { apiClient } from './api';
import type {
  Quest,
  QuestWithUserStatus,
  ClaimQuestResponse,
} from '../types/api';

export const QuestService = {
  /**
   * Get all quests
   */
  async getAllQuests(accessToken: string): Promise<Quest[]> {
    const response = await apiClient.get<Quest[]>('/quests', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return response.data;
  },

  /**
   * Get quest by ID
   */
  async getQuestById(id: string, accessToken: string): Promise<Quest> {
    const response = await apiClient.get<Quest>(`/quests/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return response.data;
  },

  /**
   * Get user's quests
   */
  async getUserQuests(
    userId: string,
    accessToken: string
  ): Promise<QuestWithUserStatus[]> {
    const response = await apiClient.get<QuestWithUserStatus[]>(
      `/quests/user-quests/${userId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch user quests');
    }

    return response.data;
  },

  /**
   * Get specific user quest
   */
  async getUserQuest(
    questId: string,
    userId: string,
    accessToken: string
  ): Promise<QuestWithUserStatus> {
    const response = await apiClient.get<QuestWithUserStatus>(
      `/quests/${questId}/user-quests/${userId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch user quest');
    }

    return response.data;
  },

  /**
   * Claim quest reward
   */
  async claimQuest(
    questId: string,
    accessToken: string
  ): Promise<ClaimQuestResponse> {
    const response = await apiClient.post<ClaimQuestResponse>(
      `/quests/${questId}/claim`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to claim quest');
    }

    return response.data;
  },

  /**
   * Format reward amount from string or bigint to readable string
   */
  formatReward(reward: string | bigint | number): string {
    const rewardNumber =
      typeof reward === 'string' ? Number.parseFloat(reward) : Number(reward);
    const ethAmount = rewardNumber / 10 ** 18;
    return ethAmount.toFixed(4);
  },

  /**
   * Check if quest is expired
   */
  isQuestExpired(expiry: number): boolean {
    return Date.now() > expiry * 1000;
  },

  /**
   * Get quest type display name
   */
  getQuestTypeDisplayName(questType: string): string {
    const displayNames: Record<string, string> = {
      SEND_ERC20: 'Send ERC20 Token',
      RECEIVE_ERC20: 'Receive ERC20 Token',
      SEND_NFT: 'Send NFT',
      RECEIVE_NFT: 'Receive NFT',
    };

    return displayNames[questType] || questType;
  },
};
