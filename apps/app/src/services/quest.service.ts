import { apiClient } from './api';
import type {
  Quest,
  QuestWithUserStatus,
  ClaimQuestResponse,
} from '../types/api';
import { arbitrumSepolia } from 'viem/chains';
import { CLAIMER_ABI } from '../assets/claimer-abi';
import { createPublicClient, createWalletClient, custom, http } from 'viem';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

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

    // Create public client for reading from Claimer contract
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(),
    });

    const claimerContractAddress = '0xbE8D5D3Bed95d727A31522dC36f3AB3fD2CE7c2f';

    for (const quest of response.data) {
      console.log('Processing quest', quest);
      try {
        const predictedReward = await publicClient.readContract({
          address: claimerContractAddress,
          abi: CLAIMER_ABI,
          functionName: 'predictRewards',
          args: [quest.id],
        }) as bigint;

        quest.reward = Number(predictedReward);

        console.log('Predicted reward for quest', quest.id, 'is', quest.reward);
      } catch (error) {
        console.error(`Failed to predict rewards for quest ${quest.id}:`, error);
        quest.reward = 0;
      }
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
   * Start quest (change status to IN_PROGRESS)
   */
  async startQuest(
    questId: string,
    userId: string,
    accessToken: string
  ): Promise<void> {
    const response = await apiClient.put(
      `/quests/${questId}/change-status`,
      { userId },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.success) {
      throw new Error('Failed to start quest');
    }
  },

  /**
   * Get quest status for user
   */
  async getQuestStatus(
    questId: string,
    userId: string,
    accessToken: string
  ): Promise<string> {
    const response = await apiClient.get<{ status: string }>(
      `/quests/${questId}/status/${userId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to get quest status');
    }

    return response.data.status;
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
      undefined,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to claim quest');
    }

    const signature = response.data.signature;

    const walletClient = createWalletClient({
      chain: arbitrumSepolia,
      transport: custom(window.ethereum),
    });

    const [account] = await walletClient.getAddresses();
    if (!account) {
      throw new Error('No wallet account found');
    }

    const claimerContractAddress = '0xbE8D5D3Bed95d727A31522dC36f3AB3fD2CE7c2f';

    try {
      const hash = await walletClient.writeContract({
        address: claimerContractAddress,
        abi: CLAIMER_ABI,
        functionName: 'claim',
        args: [questId, signature],
        account,
      });

      const publicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(),
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        console.log('Quest claimed successfully:', hash);
      } else {
        throw new Error('Transaction failed');
      }

    } catch (contractError) {
      console.error('Contract interaction failed:', contractError);
      throw new Error('Failed to claim reward on blockchain');
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
