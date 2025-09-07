import { ENetworks } from 'lib/enums/networks';
import {
  blockchainParserState,
  userQuests,
  users,
  quests,
  userBalances,
  userClaims,
} from '../databases/main-postgres/schema';
import { and, eq, sql, desc } from 'drizzle-orm';
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
      .where(eq(blockchainParserState.network, ENetworks.ARBITRUM))
      .orderBy(desc(blockchainParserState.lastProcessedBlock));
    return block?.lastProcessedBlock ?? CONFIG.PARSING.ARBITRUM.START_BLOCK;
  };

  export const saveLastProcessedBlockNumber = async (blockNumber: number) => {
    await db
      .insert(blockchainParserState)
      .values({
        network: ENetworks.ARBITRUM,
        lastProcessedBlock: blockNumber,
      })
      .onConflictDoNothing();
  };

  export const parse = async () => {
    const parseStartTime = Date.now();
    console.log('🔍 [ClaimsParser] Starting blockchain parsing cycle...');

    try {
      console.log('🔗 [ClaimsParser] Connecting to Arbitrum provider...');
      const provider = EvmService.getJsonRpcProvider(ENetworks.ARBITRUM);

      console.log('📊 [ClaimsParser] Fetching block information...');
      const [lastProcessedBlockNumber, currentBlockNumber] = await Promise.all([
        getLastProcessedBlockNumber(),
        EvmService.getCurrentBlockNumber(provider),
      ]);

      let endBlock = currentBlockNumber - 1;
      const startBlock = lastProcessedBlockNumber;

      console.log(`📈 [ClaimsParser] Block status:
        - Last processed: ${lastProcessedBlockNumber}
        - Current network: ${currentBlockNumber}
        - Processing range: ${startBlock} → ${endBlock}
        - Blocks to process: ${Math.max(0, endBlock - startBlock)}`);

      if (startBlock >= endBlock) {
        console.log(
          '✅ [ClaimsParser] No new blocks to process - blockchain is up to date'
        );
        return;
      }

      // Check if we need to limit the batch size
      const originalEndBlock = endBlock;
      if (
        endBlock - startBlock >
        CONFIG.PARSING.ARBITRUM.MAX_BLOCKS_TO_PROCESS
      ) {
        endBlock = startBlock + CONFIG.PARSING.ARBITRUM.MAX_BLOCKS_TO_PROCESS;
        console.log(`⚠️  [ClaimsParser] Large block range detected - limiting batch:
          - Original range: ${startBlock} → ${originalEndBlock} (${
          originalEndBlock - startBlock
        } blocks)
          - Limited range: ${startBlock} → ${endBlock} (${
          endBlock - startBlock
        } blocks)
          - Max blocks per batch: ${
            CONFIG.PARSING.ARBITRUM.MAX_BLOCKS_TO_PROCESS
          }`);
      }

      console.log(
        `🔎 [ClaimsParser] Fetching logs for block range ${startBlock} → ${endBlock}...`
      );
      const logFetchStartTime = Date.now();

      const logs = await EvmService.getLogsInBlockRange(
        provider,
        [CONFIG.PARSING.ARBITRUM.CLAIMER_CONTRACT_ADDRESS],
        startBlock,
        endBlock
      );

      const logFetchDuration = Date.now() - logFetchStartTime;
      console.log(`📋 [ClaimsParser] Log fetch completed:
        - Found ${logs.length} events
        - Fetch duration: ${logFetchDuration}ms`);

      if (logs.length === 0) {
        console.log(
          '📭 [ClaimsParser] No claim events found in this block range'
        );
        await saveLastProcessedBlockNumber(endBlock);
        console.log(
          `💾 [ClaimsParser] Updated last processed block to: ${endBlock}`
        );
        const totalDuration = Date.now() - parseStartTime;
        console.log(
          `⏱️  [ClaimsParser] Parse cycle completed in ${totalDuration}ms (no events to process)`
        );
        return;
      }

      // Parse claim events from smart contract
      console.log(
        `🔄 [ClaimsParser] Processing ${logs.length} claim events...`
      );
      let lastProcessedBlockNumberInCurrentBatch = startBlock;
      let processedEvents = 0;
      let skippedEvents = 0;
      let errorEvents = 0;

      for (const [index, log] of logs.entries()) {
        try {
          console.log(
            `📝 [ClaimsParser] Processing event ${index + 1}/${
              logs.length
            } (Block: ${log.blockNumber}, TxHash: ${log.transactionHash})`
          );

          const decoded = decodeClaimEvent(log);
          if (!decoded) {
            skippedEvents++;
            console.log(
              `⏭️  [ClaimsParser] Skipped event ${index + 1} - failed to decode`
            );
            continue;
          }

          const { questId, user, token, amount, timestamp } = decoded;
          console.log(`🎯 [ClaimsParser] Decoded claim event:
            - Quest ID: ${questId}
            - User: ${user}
            - Token: ${token}
            - Amount: ${amount}
            - Timestamp: ${timestamp}
            - Block: ${log.blockNumber}
            - Transaction: ${log.transactionHash}`);

          const eventProcessStartTime = Date.now();
          await handleClaimEvent({
            questId,
            user,
            token,
            amount,
            timestamp,
            transactionHash: log.transactionHash,
          });
          const eventProcessDuration = Date.now() - eventProcessStartTime;

          processedEvents++;
          console.log(
            `✅ [ClaimsParser] Successfully processed event ${
              index + 1
            } in ${eventProcessDuration}ms`
          );

          // Update block progress if we've moved to a new block
          if (log.blockNumber !== lastProcessedBlockNumberInCurrentBatch) {
            await saveLastProcessedBlockNumber(log.blockNumber);
            lastProcessedBlockNumberInCurrentBatch = log.blockNumber;
            console.log(
              `💾 [ClaimsParser] Updated progress to block: ${log.blockNumber}`
            );
          }
        } catch (error) {
          errorEvents++;
          console.error(`❌ [ClaimsParser] Error processing event ${index + 1}:
            - Transaction: ${log.transactionHash}
            - Block: ${log.blockNumber}
            - Error: ${error}
            - Stack: ${
              error instanceof Error ? error.stack : 'No stack trace'
            }`);
        }
      }

      // Final block number update
      await saveLastProcessedBlockNumber(endBlock);

      const totalDuration = Date.now() - parseStartTime;
      console.log(`🎉 [ClaimsParser] Batch processing completed:
        - Total events found: ${logs.length}
        - Successfully processed: ${processedEvents}
        - Skipped events: ${skippedEvents}
        - Error events: ${errorEvents}
        - Final processed block: ${endBlock}
        - Total duration: ${totalDuration}ms
        - Average time per event: ${
          processedEvents > 0 ? Math.round(totalDuration / processedEvents) : 0
        }ms`);
    } catch (error) {
      const totalDuration = Date.now() - parseStartTime;
      console.error(`💥 [ClaimsParser] Critical error in parse cycle:
        - Duration before error: ${totalDuration}ms
        - Error: ${error}
        - Stack: ${error instanceof Error ? error.stack : 'No stack trace'}
        - Network: ${ENetworks.ARBITRUM}`);
    } finally {
      console.log(
        '⏰ [ClaimsParser] Scheduling next parse cycle in 10 seconds...'
      );
      setTimeout(parse, 10_000);
    }
  };

  const decodeClaimEvent = (log: Log) => {
    console.log(`🔍 [ClaimsParser] Decoding claim event:
      - Transaction: ${log.transactionHash}
      - Block: ${log.blockNumber}
      - Log index: ${log.index || 'N/A'}`);

    try {
      const iface = new Interface(CLAIMER_CONTRACT);
      const parsed = iface.parseLog(log);

      if (!parsed || parsed.name !== 'Claimed') {
        console.log(`❌ [ClaimsParser] Failed to decode claim event:
          - Transaction: ${log.transactionHash}
          - Block: ${log.blockNumber}
          - Expected event: 'Claimed'
          - Actual event: ${parsed?.name || 'null'}
          - Topics: ${JSON.stringify(log.topics)}
          - Data: ${log.data}`);
        return null;
      }

      const [questId, user, token, amount, timestamp] = parsed.args;
      console.log(`✅ [ClaimsParser] Successfully decoded claim event:
        - Transaction: ${log.transactionHash}
        - Event name: ${parsed.name}
        - Args count: ${parsed.args.length}`);

      return { questId, user, token, amount, timestamp };
    } catch (error) {
      console.error(`💥 [ClaimsParser] Error decoding claim event:
        - Transaction: ${log.transactionHash}
        - Block: ${log.blockNumber}
        - Error: ${error}
        - Stack: ${error instanceof Error ? error.stack : 'No stack trace'}
        - Log topics: ${JSON.stringify(log.topics)}
        - Log data: ${log.data}`);
      return null;
    }
  };

  const handleClaimEvent = async (claimData: {
    questId: string;
    user: string;
    token: string;
    amount: bigint;
    timestamp: bigint;
    transactionHash: string;
  }) => {
    const eventStartTime = Date.now();
    console.log(
      `🔧 [ClaimsParser] Handling claim event for transaction: ${claimData.transactionHash}`
    );

    try {
      const userWalletAddress = claimData.user.toLowerCase();
      console.log(
        `👤 [ClaimsParser] Looking up user with wallet: ${userWalletAddress}`
      );

      // Find the user by wallet address
      const userLookupStartTime = Date.now();
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(sql`lower(${users.walletAddress})`, userWalletAddress));
      const userLookupDuration = Date.now() - userLookupStartTime;

      if (!user) {
        console.log(`❌ [ClaimsParser] User not found:
          - Wallet address: ${userWalletAddress}
          - Quest ID: ${claimData.questId}
          - Transaction: ${claimData.transactionHash}
          - Lookup duration: ${userLookupDuration}ms`);
        return;
      }

      console.log(
        `✅ [ClaimsParser] User found (ID: ${user.id}) in ${userLookupDuration}ms`
      );

      // Find the specific quest that was claimed and is in CLAIM status
      console.log(`🎯 [ClaimsParser] Looking up quest in CLAIM status:
        - Quest ID: ${claimData.questId}
        - User ID: ${user.id}`);

      const questLookupStartTime = Date.now();
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
      const questLookupDuration = Date.now() - questLookupStartTime;

      if (!userQuest) {
        console.log(`❌ [ClaimsParser] Quest not found in CLAIM status:
          - Quest ID: ${claimData.questId}
          - User wallet: ${userWalletAddress}
          - User ID: ${user.id}
          - Transaction: ${claimData.transactionHash}
          - Quest lookup duration: ${questLookupDuration}ms
          - Possible reasons: Quest already completed, quest not assigned to user, or quest doesn't exist`);
        return;
      }

      console.log(`✅ [ClaimsParser] Quest found in CLAIM status:
        - Quest name: '${userQuest.questName}'
        - User quest ID: ${userQuest.userQuestId}
        - Quest lookup duration: ${questLookupDuration}ms`);

      // Execute all database operations in a transaction for consistency
      console.log(
        '🔄 [ClaimsParser] Starting database transaction for claim processing...'
      );
      const transactionStartTime = Date.now();

      await db.transaction(async (tx) => {
        console.log(
          '📝 [ClaimsParser] Step 1: Updating quest status from CLAIM to COMPLETED'
        );
        const statusUpdateStartTime = Date.now();

        // Process all matching quests
        // Update quest status to COMPLETED with optimistic lock
        await updateUserQuestStatusWithOptimisticLockInTransaction(
          tx,
          userQuest.questId,
          userWalletAddress,
          EQuestStatuses.CLAIM,
          EQuestStatuses.COMPLETED
        );

        const statusUpdateDuration = Date.now() - statusUpdateStartTime;
        console.log(
          `✅ [ClaimsParser] Quest status updated in ${statusUpdateDuration}ms`
        );

        console.log('💾 [ClaimsParser] Step 2: Recording claim in history');
        const claimRecordStartTime = Date.now();

        // Save claim history
        await tx.insert(userClaims).values({
          userId: user.id,
          questId: userQuest.questId,
          claimAmount: claimData.amount.toString(),
          claimTokenAddress: claimData.token,
          claimTimestamp: Number(claimData.timestamp),
          claimTransactionHash: claimData.transactionHash,
        });

        const claimRecordDuration = Date.now() - claimRecordStartTime;
        console.log(
          `✅ [ClaimsParser] Claim recorded in history in ${claimRecordDuration}ms`
        );

        console.log('💰 [ClaimsParser] Step 3: Updating user balance');
        const balanceUpdateStartTime = Date.now();

        // Update user balance
        await updateUserBalanceInTransaction(tx, user.id, claimData.amount);

        const balanceUpdateDuration = Date.now() - balanceUpdateStartTime;
        console.log(
          `✅ [ClaimsParser] User balance updated in ${balanceUpdateDuration}ms`
        );
      });

      const transactionDuration = Date.now() - transactionStartTime;
      const totalEventDuration = Date.now() - eventStartTime;

      console.log(`🎉 [ClaimsParser] Claim event processed successfully:
        - Quest: '${userQuest.questName}'
        - User: ${userWalletAddress}
        - Amount: ${claimData.amount}
        - Token: ${claimData.token}
        - Transaction: ${claimData.transactionHash}
        - Database transaction duration: ${transactionDuration}ms
        - Total event processing duration: ${totalEventDuration}ms`);
    } catch (error) {
      const totalEventDuration = Date.now() - eventStartTime;
      console.error(`💥 [ClaimsParser] Error handling claim event:
        - Transaction: ${claimData.transactionHash}
        - Quest ID: ${claimData.questId}
        - User: ${claimData.user}
        - Amount: ${claimData.amount}
        - Token: ${claimData.token}
        - Duration before error: ${totalEventDuration}ms
        - Error: ${error}
        - Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      throw error; // Re-throw to be caught by the parent error handler
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
    console.log(
      `💰 [ClaimsParser] Updating balance for user ${userId} with amount: ${amount}`
    );

    // Try to get existing balance for this user and token
    const balanceLookupStartTime = Date.now();
    const [existingBalance] = await tx
      .select()
      .from(userBalances)
      .where(eq(userBalances.userId, userId));
    const balanceLookupDuration = Date.now() - balanceLookupStartTime;

    if (existingBalance) {
      console.log(`📊 [ClaimsParser] Found existing balance:
        - Current balance: ${existingBalance.balance}
        - Amount to add: ${amount}
        - Balance lookup duration: ${balanceLookupDuration}ms`);

      // Update existing balance by adding the claimed amount with optimistic lock
      const currentBalance = BigInt(existingBalance.balance);
      const newBalance = currentBalance + amount;

      const balanceUpdateStartTime = Date.now();
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
      const balanceUpdateDuration = Date.now() - balanceUpdateStartTime;

      if (!updated?.id) {
        console.error(`❌ [ClaimsParser] Balance update failed - optimistic lock:
          - User ID: ${userId}
          - Attempted update from: ${existingBalance.balance}
          - Attempted new balance: ${newBalance}
          - This indicates concurrent modification of the balance`);
        throw new Error(
          `Failed to update balance for user ${userId} - optimistic lock failed (concurrent modification)`
        );
      }

      console.log(`✅ [ClaimsParser] Balance updated successfully:
        - User ID: ${userId}
        - Previous balance: ${existingBalance.balance}
        - Added amount: ${amount}
        - New balance: ${newBalance}
        - Update duration: ${balanceUpdateDuration}ms`);
    } else {
      console.log(`🆕 [ClaimsParser] No existing balance found, creating new record:
        - User ID: ${userId}
        - Initial balance: ${amount}
        - Balance lookup duration: ${balanceLookupDuration}ms`);

      const balanceCreateStartTime = Date.now();
      // Create new balance record
      await tx.insert(userBalances).values({
        userId,
        balance: amount.toString(),
      });
      const balanceCreateDuration = Date.now() - balanceCreateStartTime;

      console.log(`✅ [ClaimsParser] New balance created:
        - User ID: ${userId}
        - Initial balance: ${amount}
        - Creation duration: ${balanceCreateDuration}ms`);
    }
  };
}

ClaimsParserService.parse();
