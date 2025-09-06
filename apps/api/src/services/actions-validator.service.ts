import { ENetworks } from 'lib/enums/networks';
import {
  blockchainParserState,
  quests,
  userQuests,
  users,
} from '../databases/main-postgres/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../databases/main-postgres';
import { CONFIG } from '../config';
import { EvmService } from './blockchain/evm.service';
import { EQuestStatuses, EQuestTypes } from 'lib/enums/quests';
import { Interface, type Log } from 'ethers';
import { ERC20_ABI } from '../abis/erc20.abi';
import { ERC721_ABI } from '../abis/erc721.abi';

export namespace ActionsValidatorService {
  export const getLastProcessedBlockNumber = async () => {
    const [block] = await db
      .select()
      .from(blockchainParserState)
      .where(eq(blockchainParserState.network, ENetworks.ZETACHAIN));
    return block.lastProcessedBlock ?? CONFIG.PARSING.ARBITRUM.START_BLOCK;
  };

  export const saveLastProcessedBlockNumber = async (blockNumber: number) => {
    await db.insert(blockchainParserState).values({
      network: ENetworks.ZETACHAIN,
      lastProcessedBlock: blockNumber,
    });
  };

  export const getTargetContractAddresses = async () => {
    const questsList = await db
      .select()
      .from(quests)
      .where(isNull(quests.deletedAt));

    return questsList.reduce((acc, quest) => {
      const address =
        quest.questType === EQuestTypes.SEND_ERC20
          ? // biome-ignore lint/style/noNonNullAssertion: <explanation>
            quest.tokenAddress!
          : // biome-ignore lint/style/noNonNullAssertion: <explanation>
            quest.nftAddress!;

      acc.set(address, {
        questId: quest.id,
        questType: quest.questType,
      });
      return acc;
    }, new Map<string, { questId: string; questType: EQuestTypes }>());
  };

  export const parse = async () => {
    try {
      const provider = EvmService.getJsonRpcProvider(ENetworks.ZETACHAIN);

      const [lastProcessedBlockNumber, currentBlockNumber] = await Promise.all([
        getLastProcessedBlockNumber(),
        EvmService.getCurrentBlockNumber(provider),
      ]);

      let endBlock = currentBlockNumber - 1;
      const startBlock = lastProcessedBlockNumber;

      if (startBlock >= endBlock) {
        console.log('No new blocks to process');
        return setTimeout(parse, 5000);
      }

      if (
        endBlock - startBlock >
        CONFIG.PARSING.ARBITRUM.MAX_BLOCKS_TO_PROCESS
      ) {
        endBlock = startBlock + CONFIG.PARSING.ARBITRUM.MAX_BLOCKS_TO_PROCESS;
      }

      const targetContractAddressesMap = await getTargetContractAddresses();
      const targetContractAddresses = Array.from(
        targetContractAddressesMap.keys()
      );
      const logs = await EvmService.getLogsInBlockRange(
        provider,
        targetContractAddresses,
        startBlock,
        endBlock
      );

      let lastProcessedBlockNumberInCurrentBatch = startBlock;
      for (const log of logs) {
        try {
          const config = targetContractAddressesMap.get(log.address);
          if (!config) {
            console.log(`Quest with address ${log.address} not found`);
            continue;
          }

          switch (config.questType) {
            case EQuestTypes.RECEIVE_ERC20:
            case EQuestTypes.SEND_ERC20: {
              const decoded = decodeERC20TransferEvent(log);
              if (!decoded) {
                continue;
              }
              const { from, to, value } = decoded;
              console.log(`ERC20 transfer event: ${from} -> ${to} -> ${value}`);
              await handleERC20Quest(config.questId, { from, to, value });
              break;
            }
            case EQuestTypes.SEND_NFT:
            case EQuestTypes.RECEIVE_NFT: {
              const decoded = decodeNFTTransferEvent(log);
              if (!decoded) {
                continue;
              }
              const { from, to, tokenId } = decoded;
              console.log(`NFT transfer event: ${from} -> ${to} -> ${tokenId}`);
              break;
            }
          }

          if (log.blockNumber !== lastProcessedBlockNumberInCurrentBatch) {
            await saveLastProcessedBlockNumber(log.blockNumber);
            lastProcessedBlockNumberInCurrentBatch = log.blockNumber;
          }
        } catch (error) {
          console.error(
            `Error processing log ${log.transactionHash}: ${error}`
          );
        }
      }
      await saveLastProcessedBlockNumber(
        lastProcessedBlockNumberInCurrentBatch
      );
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(parse, 5000);
    }
  };

  const decodeERC20TransferEvent = (log: Log) => {
    const iface = new Interface(ERC20_ABI);
    const parsed = iface.parseLog(log);

    if (!parsed) {
      console.log(
        `Failed to parse ERC20 transfer event for log ${log.transactionHash}`
      );
      return null;
    }

    const [from, to, value] = parsed.args;
    return { from, to, value };
  };

  const decodeNFTTransferEvent = (log: Log) => {
    const iface = new Interface(ERC721_ABI);
    const parsed = iface.parseLog(log);

    if (!parsed) {
      console.log(
        `Failed to parse NFT transfer event for log ${log.transactionHash}`
      );
      return null;
    }

    const [from, to, tokenId] = parsed.args;
    return { from, to, tokenId };
  };

  export const updateUserQuestStatusWithOptimisticLock = async (
    questId: string,
    walletAddress: string,
    fromStatus: EQuestStatuses,
    toStatus: EQuestStatuses
  ): Promise<void> => {
    const userWalletAddress = walletAddress.toLowerCase();
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(sql`lower(${users.walletAddress})`, userWalletAddress));

    if (!user) {
      throw new Error(
        `User with wallet address ${userWalletAddress} not found`
      );
    }

    const [updated] = await db
      .update(userQuests)
      .set({ status: toStatus })
      .where(
        and(
          eq(userQuests.questId, questId),
          eq(userQuests.status, fromStatus),
          eq(userQuests.userId, user.id)
        )
      )
      .returning({ id: userQuests.id });

    if (!updated?.id) {
      throw new Error(`Quest with id ${questId} not found`);
    }
  };

  export const isERC20QuestCompleted = async (
    expected: {
      from: string | null;
      to: string | null;
      value: bigint | null;
    },
    actual: {
      from: string;
      to: string;
      value: bigint;
    }
  ) => {
    if (
      expected.from &&
      expected.from.toLowerCase() !== actual.from.toLowerCase()
    ) {
      console.log(
        `From ${actual.from} is not the expected from ${expected.from}`
      );
      return false;
    }
    if (expected.to && expected.to.toLowerCase() !== actual.to.toLowerCase()) {
      console.log(`To ${actual.to} is not the expected to ${expected.to}`);
      return;
    }

    if (expected.value && expected.value !== actual.value) {
      console.log(
        `Value ${actual.value} is not the expected value ${expected.value}`
      );
      return false;
    }

    return true;
  };

  export const handleERC20Quest = async (
    questId: string,
    actual: {
      from: string;
      to: string;
      value: bigint;
    }
  ) => {
    const [questInfo] = await db
      .select()
      .from(quests)
      .where(eq(quests.id, questId));

    if (!questInfo) {
      console.log(`Quest with id ${questId} not found`);
      return;
    }

    let expectedResult: {
      from: string | null;
      to: string | null;
      value: bigint | null;
    };

    let userWalletAddress: string;
    if (questInfo.questType === EQuestTypes.SEND_ERC20) {
      expectedResult = {
        from: null,
        to: questInfo.toAddress,
        value: questInfo.amount ? BigInt(questInfo.amount) : null,
      };
      userWalletAddress = actual.from;
    } else if (questInfo.questType === EQuestTypes.RECEIVE_ERC20) {
      expectedResult = {
        from: questInfo.fromAddress,
        to: null,
        value: questInfo.amount ? BigInt(questInfo.amount) : null,
      };
      userWalletAddress = actual.to;
    } else {
      console.log(`Quest with id ${questId} is not a valid ERC20 quest`);
      return;
    }

    const isQuestCompleted = isERC20QuestCompleted(expectedResult, actual);
    if (!isQuestCompleted) {
      console.log(`Quest with id ${questId} is not completed`);
      return;
    }

    await updateUserQuestStatusWithOptimisticLock(
      questId,
      userWalletAddress,
      EQuestStatuses.IN_PROGRESS,
      EQuestStatuses.CLAIM
    );
  };

  export const handleNFTQuest = async (
    questId: string,
    actual: {
      from: string;
      to: string;
    }
  ) => {
    const [questInfo] = await db
      .select()
      .from(quests)
      .where(eq(quests.id, questId));

    if (!questInfo) {
      console.log(`Quest with id ${questId} not found`);
      return;
    }

    let expectedResult: {
      from: string | null;
      to: string | null;
    };

    let userWalletAddress: string;
    if (questInfo.questType === EQuestTypes.SEND_ERC20) {
      expectedResult = {
        from: null,
        to: questInfo.toAddress,
      };
      userWalletAddress = actual.from;
    } else if (questInfo.questType === EQuestTypes.RECEIVE_ERC20) {
      expectedResult = {
        from: questInfo.fromAddress,
        to: null,
      };
      userWalletAddress = actual.to;
    } else {
      console.log(`Quest with id ${questId} is not a valid NFT quest`);
      return;
    }

    const isQuestCompleted = isNFTQuestCompleted(expectedResult, actual);
    if (!isQuestCompleted) {
      console.log(`Quest with id ${questId} is not completed`);
      return;
    }

    await updateUserQuestStatusWithOptimisticLock(
      questId,
      userWalletAddress,
      EQuestStatuses.IN_PROGRESS,
      EQuestStatuses.CLAIM
    );
  };

  export const isNFTQuestCompleted = async (
    expected: {
      from: string | null;
      to: string | null;
    },
    actual: {
      from: string;
      to: string;
    }
  ) => {
    if (
      expected.from &&
      expected.from.toLowerCase() !== actual.from.toLowerCase()
    ) {
      console.log(
        `From ${actual.from} is not the expected from ${expected.from}`
      );
      return false;
    }
    if (expected.to && expected.to.toLowerCase() !== actual.to.toLowerCase()) {
      console.log(`To ${actual.to} is not the expected to ${expected.to}`);
      return false;
    }

    return true;
  };
}
