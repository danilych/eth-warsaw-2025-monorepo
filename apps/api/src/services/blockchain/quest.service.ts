import { Contract, Wallet } from 'ethers';
import { ENetworks } from 'lib/enums/networks';
import { EvmService } from './evm.service';
import { QUEST_CONTRACT } from '../../abis/quest.abi';

export namespace QuestService {
  export const getReadContract = () => {
    const provider = EvmService.getJsonRpcProvider(ENetworks.ARBITRUM);

    const readContract = new Contract(
      QUEST_CONTRACT.address,
      QUEST_CONTRACT.abi,
      provider
    );

    return readContract;
  };

  export const getWriteContract = () => {
    const provider = EvmService.getJsonRpcProvider(ENetworks.ARBITRUM);

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        'PRIVATE_KEY environment variable is required for write operations'
      );
    }

    const wallet = new Wallet(privateKey, provider);
    const writeContract = new Contract(
      QUEST_CONTRACT.address,
      QUEST_CONTRACT.abi,
      wallet
    );

    return writeContract;
  };

  export const getQuest = (id: string) => {
    try {
      const readContract = getReadContract();
      const quest = readContract.getQuest(id);
      return quest;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  export const createQuest = (data: {
    id: string;
    reward: string;
    rewardToken: string;
    expiry: number;
    startsAt: number;
  }) => {
    try {
      const writeContract = getWriteContract();
      const quest = writeContract.createQuest(
        data.id,
        data.reward,
        data.rewardToken,
        data.expiry,
        data.startsAt
      );
      return quest;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  export const removeQuest = (id: string) => {
    try {
      const writeContract = getWriteContract();
      const quest = writeContract.removeQuest(id);
      return quest;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
}
