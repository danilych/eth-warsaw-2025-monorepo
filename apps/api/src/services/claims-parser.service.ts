import { ENetworks } from 'lib/enums/networks';
import {
  blockchainParserState,
  userQuests,
  users,
  quests,
  userBalances,
  userClaims,
} from '../databases/main-postgres/schema';
import { and, eq, sql } from 'drizzle-orm';
import { db, type DatabaseTypeBase } from '../databases/main-postgres';
import { CONFIG } from '../config';
import { EvmService } from './blockchain/evm.service';
import { EQuestStatuses } from 'lib/enums/quests';
import { Interface, type Log } from 'ethers';
import { CLAIMER_CONTRACT } from '../abis/claimer.abi';

export namespace ClaimsParserService {
  export const getLastProcessedBlockNumber = async () => {
    const [block] = await db
      .select()
      .from(blockchainParserState)
      .where(eq(blockchainParserState.network, ENetworks.ARBITRUM));
    return block.lastProcessedBlock ?? CONFIG.PARSING.ARBITRUM.START_BLOCK;
  };

  export const saveLastProcessedBlockNumber = async (blockNumber: number) => {
    await db
      .insert(blockchainParserState)
      .values({
        network: ENetworks.ARBITRUM,
        lastProcessedBlock: blockNumber,
      })
      .onConflictDoUpdate({
        target: blockchainParserState.network,
        set: {
          lastProcessedBlock: blockNumber,
          updatedAt: new Date(),
        },
      });
  };

  export const parse = async () => {
    try {
      const provider = EvmService.getJsonRpcProvider(ENetworks.ARBITRUM);

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

      const logs = await EvmService.getLogsInBlockRange(
        provider,
        [CONFIG.PARSING.ARBITRUM.EVENT_SIGNATURE],
        startBlock,
        endBlock
      );
      // Parse claim events from smart contract
      let lastProcessedBlockNumberInCurrentBatch = startBlock;
      for (const log of logs) {
        try {
          const decoded = decodeClaimEvent(log);
          if (!decoded) {
            continue;
          }
          const { questId, user, token, amount, timestamp } = decoded;
          console.log(
            `Claim event: questId=${questId}, user=${user}, token=${token}, amount=${amount}, timestamp=${timestamp}`
          );
          await handleClaimEvent({
            questId,
            user,
            token,
            amount,
            timestamp,
            transactionHash: log.transactionHash,
          });

          if (log.blockNumber !== lastProcessedBlockNumberInCurrentBatch) {
            await saveLastProcessedBlockNumber(log.blockNumber);
            lastProcessedBlockNumberInCurrentBatch = log.blockNumber;
          }
        } catch (error) {
          console.error(
            `Error processing claim log ${log.transactionHash}: ${error}`
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

  const decodeClaimEvent = (log: Log) => {
    const iface = new Interface(CLAIMER_CONTRACT);
    const parsed = iface.parseLog(log);

    if (!parsed || parsed.name !== 'Claimed') {
      console.log(
        `Failed to parse Claimed event for log ${log.transactionHash}`
      );
      return null;
    }

    const [questId, user, token, amount, timestamp] = parsed.args;
    return { questId, user, token, amount, timestamp };
  };

  const handleClaimEvent = async (claimData: {
    questId: string;
    user: string;
    token: string;
    amount: bigint;
    timestamp: bigint;
    transactionHash: string;
  }) => {
    try {
      const userWalletAddress = claimData.user.toLowerCase();

      // Find the user by wallet address
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(sql`lower(${users.walletAddress})`, userWalletAddress));

      if (!user) {
        console.log(`User with wallet address ${userWalletAddress} not found`);
        return;
      }

      // Find the specific quest that was claimed and is in CLAIM status
      const [userQuest] = await db
        .select({
          userQuestId: userQuests.id,
          questId: userQuests.questId,
          questName: quests.name,
        })
        .from(userQuests)
        .leftJoin(quests, eq(userQuests.questId, quests.id))
        .where(
          and(
            eq(userQuests.userId, user.id),
            eq(userQuests.status, EQuestStatuses.CLAIM),
            eq(userQuests.questId, claimData.questId)
          )
        );

      if (!userQuest) {
        console.log(
          `Quest ${claimData.questId} not found in CLAIM status for user ${userWalletAddress}`
        );
        return;
      }

      // Execute all database operations in a transaction for consistency
      await db.transaction(async (tx) => {
        // Process all matching quests
        // Update quest status to COMPLETED with optimistic lock
        await updateUserQuestStatusWithOptimisticLockInTransaction(
          tx,
          userQuest.questId,
          userWalletAddress,
          EQuestStatuses.CLAIM,
          EQuestStatuses.COMPLETED
        );

        // Save claim history
        await tx.insert(userClaims).values({
          userId: user.id,
          questId: userQuest.questId,
          claimAmount: claimData.amount.toString(),
          claimTokenAddress: claimData.token,
          claimTimestamp: Number(claimData.timestamp),
          claimTransactionHash: claimData.transactionHash,
        });

        console.log(
          `Quest '${userQuest.questName}' completed for user ${userWalletAddress}. Amount claimed: ${claimData.amount}`
        );
        // Update user balance
        await updateUserBalanceInTransaction(tx, user.id, claimData.amount);
      });
    } catch (error) {
      console.error(`Error handling claim event: ${error}`);
    }
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
      throw new Error(
        `Failed to update quest ${questId} from ${fromStatus} to ${toStatus} - optimistic lock failed`
      );
    }
  };

  const updateUserQuestStatusWithOptimisticLockInTransaction = async (
    tx: DatabaseTypeBase,
    questId: string,
    walletAddress: string,
    fromStatus: EQuestStatuses,
    toStatus: EQuestStatuses
  ): Promise<void> => {
    const userWalletAddress = walletAddress.toLowerCase();
    const [user] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(sql`lower(${users.walletAddress})`, userWalletAddress));

    if (!user) {
      throw new Error(
        `User with wallet address ${userWalletAddress} not found`
      );
    }

    const [updated] = await tx
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
      throw new Error(
        `Failed to update quest ${questId} from ${fromStatus} to ${toStatus} - optimistic lock failed`
      );
    }
  };

  const updateUserBalanceInTransaction = async (
    tx: DatabaseTypeBase,
    userId: string,
    amount: bigint
  ) => {
    // Try to get existing balance for this user and token
    const [existingBalance] = await tx
      .select()
      .from(userBalances)
      .where(eq(userBalances.userId, userId));

    if (existingBalance) {
      // Update existing balance by adding the claimed amount with optimistic lock
      const currentBalance = BigInt(existingBalance.balance);
      const newBalance = currentBalance + amount;

      const [updated] = await tx
        .update(userBalances)
        .set({
          balance: newBalance.toString(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userBalances.id, existingBalance.id),
            eq(userBalances.balance, existingBalance.balance) // Optimistic lock on balance
          )
        )
        .returning({ id: userBalances.id });

      if (!updated?.id) {
        throw new Error(
          `Failed to update balance for user ${userId} - optimistic lock failed (concurrent modification)`
        );
      }

      console.log(
        `Updated balance for user ${userId}: ${existingBalance.balance} + ${amount} = ${newBalance}`
      );
    } else {
      // Create new balance record
      await tx.insert(userBalances).values({
        userId,
        balance: amount.toString(),
      });

      console.log(`Created new balance for user ${userId}: ${amount}`);
    }
  };
}
