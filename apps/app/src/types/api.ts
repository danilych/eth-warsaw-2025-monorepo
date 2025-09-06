// Quest types - matching backend OpenAPI schema
export enum QuestType {
  SEND_ERC20 = 'SEND_ERC20',
  RECEIVE_ERC20 = 'RECEIVE_ERC20',
  SEND_NFT = 'SEND_NFT',
  RECEIVE_NFT = 'RECEIVE_NFT',
}

export enum QuestStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CLAIM = 'CLAIM',
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  questType: QuestType;
  target: string;
  reward: string; // Changed from bigint to string to match OpenAPI schema
  tokenAddress: string;
  expiry: number;
  fromAddress: string | null;
  amount: string | null;
  nftAddress: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface UserQuest {
  id: string;
  userId: string;
  questId: string;
  status: QuestStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface QuestWithUserStatus extends Omit<Quest, 'reward'> {
  reward: number; // In user quests, reward is number according to OpenAPI schema
  userStatus: {
    id: string;
    userId: string;
    status: QuestStatus;
    createdAt: string;
    updatedAt: string | null;
  } | null;
}

export interface CreateQuestRequest {
  name: string;
  description: string;
  imageUrl?: string;
  questType: QuestType;
  target: string;
  reward: string; // Changed from bigint to string to match OpenAPI schema
  tokenAddress: string;
  expiry: number;
  fromAddress?: string;
  amount?: string;
  nftAddress?: string;
}

export interface UpdateQuestRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  questType?: QuestType;
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  tokenAddress?: string;
  nftAddress?: string;
  reward?: string;
  rewardTokenAddress?: string;
  expiry?: number;
}

// Auth types
export interface User {
  id: string;
  civicId: string;
  walletAddress: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface ClaimQuestResponse {
  signature: string;
  questId: string;
  userAddress: string;
}

// Civic Auth types
export interface CivicUser {
  id: string;
  walletAddress?: string;
}
