import { ENetworks } from 'lib/enums/networks';
import {
  blockchainParserState,
  quests,
  userQuests,
  users,
} from '../databases/main-postgres/schema';
import { and, eq, isNull, sql, desc } from 'drizzle-orm';
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
      .where(eq(blockchainParserState.network, ENetworks.ZETACHAIN))
      .orderBy(desc(blockchainParserState.lastProcessedBlock));
    return block?.lastProcessedBlock ?? CONFIG.PARSING.ARBITRUM.START_BLOCK;
  };

  export const saveLastProcessedBlockNumber = async (blockNumber: number) => {
    await db
      .insert(blockchainParserState)
      .values({
        network: ENetworks.ZETACHAIN,
        lastProcessedBlock: blockNumber,
      })
      .onConflictDoNothing();
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
    const parseStartTime = Date.now();
    console.log(
      '🔍 [ActionsValidator] Starting blockchain validation cycle...'
    );

    try {
      console.log('🔗 [ActionsValidator] Connecting to ZetaChain provider...');
      const provider = EvmService.getJsonRpcProvider(ENetworks.ZETACHAIN);

      console.log('📊 [ActionsValidator] Fetching block information...');
      const [lastProcessedBlockNumber, currentBlockNumber] = await Promise.all([
        getLastProcessedBlockNumber(),
        EvmService.getCurrentBlockNumber(provider),
      ]);

      let endBlock = currentBlockNumber - 1;
      const startBlock = lastProcessedBlockNumber;

      console.log(`📈 [ActionsValidator] Block status:
        - Last processed: ${lastProcessedBlockNumber}
        - Current network: ${currentBlockNumber}
        - Processing range: ${startBlock} → ${endBlock}
        - Blocks to process: ${Math.max(0, endBlock - startBlock)}`);

      if (startBlock >= endBlock) {
        console.log(
          '✅ [ActionsValidator] No new blocks to process - blockchain is up to date'
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
        console.log(`⚠️  [ActionsValidator] Large block range detected - limiting batch:
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

      console.log('🎯 [ActionsValidator] Loading target contract addresses...');
      const contractLookupStartTime = Date.now();
      const targetContractAddressesMap = await getTargetContractAddresses();
      const targetContractAddresses = Array.from(
        targetContractAddressesMap.keys()
      );

      const contractLookupDuration = Date.now() - contractLookupStartTime;

      console.log(`📋 [ActionsValidator] Target contracts loaded:
        - Contract count: ${targetContractAddresses.length}
        - Lookup duration: ${contractLookupDuration}ms
        - Contract addresses: ${targetContractAddresses
          .slice(0, 3)
          .join(', ')}${targetContractAddresses.length > 3 ? '...' : ''}`);

      if (targetContractAddresses.length === 0) {
        console.log('No target contract addresses found');
        await saveLastProcessedBlockNumber(endBlock);
        console.log(
          `💾 [ActionsValidator] Updated last processed block to: ${endBlock}`
        );
        const totalDuration = Date.now() - parseStartTime;
        console.log(
          `⏱️  [ActionsValidator] Validation cycle completed in ${totalDuration}ms (no events to process)`
        );
        return;
      }

      console.log(
        `🔎 [ActionsValidator] Fetching logs for block range ${startBlock} → ${endBlock}...`
      );
      const logFetchStartTime = Date.now();

      const logs = await EvmService.getLogsInBlockRange(
        provider,
        targetContractAddresses,
        startBlock,
        endBlock
      );

      const logFetchDuration = Date.now() - logFetchStartTime;
      console.log(`📋 [ActionsValidator] Log fetch completed:
        - Found ${logs.length} events
        - Fetch duration: ${logFetchDuration}ms
        - Target contracts: ${targetContractAddresses.length}`);

      if (logs.length === 0) {
        console.log(
          '📭 [ActionsValidator] No events found in this block range'
        );
        await saveLastProcessedBlockNumber(endBlock);
        console.log(
          `💾 [ActionsValidator] Updated last processed block to: ${endBlock}`
        );
        const totalDuration = Date.now() - parseStartTime;
        console.log(
          `⏱️  [ActionsValidator] Validation cycle completed in ${totalDuration}ms (no events to process)`
        );
        return;
      }

      // Process blockchain events for quest validation
      console.log(
        `🔄 [ActionsValidator] Processing ${logs.length} blockchain events...`
      );
      let lastProcessedBlockNumberInCurrentBatch = startBlock;
      let processedEvents = 0;
      let skippedEvents = 0;
      let errorEvents = 0;
      let erc20Events = 0;
      let nftEvents = 0;

      for (const [index, log] of logs.entries()) {
        try {
          console.log(
            `📝 [ActionsValidator] Processing event ${index + 1}/${
              logs.length
            } (Block: ${log.blockNumber}, TxHash: ${log.transactionHash})`
          );

          const config = targetContractAddressesMap.get(log.address);
          if (!config) {
            skippedEvents++;
            console.log(
              `⏭️  [ActionsValidator] Skipped event ${
                index + 1
              } - contract address ${log.address} not in target list`
            );
            continue;
          }

          console.log(`🎯 [ActionsValidator] Found target contract:
            - Address: ${log.address}
            - Quest ID: ${config.questId}
            - Quest Type: ${config.questType}
            - Transaction: ${log.transactionHash}`);

          const eventProcessStartTime = Date.now();

          switch (config.questType) {
            case EQuestTypes.RECEIVE_ERC20:
            case EQuestTypes.SEND_ERC20: {
              console.log(
                '💰 [ActionsValidator] Processing ERC20 transfer event...'
              );
              const decoded = decodeERC20TransferEvent(log);
              if (!decoded) {
                skippedEvents++;
                console.log(
                  `⏭️  [ActionsValidator] Skipped ERC20 event ${
                    index + 1
                  } - failed to decode`
                );
                continue;
              }
              const { from, to, value } = decoded;
              console.log(`✅ [ActionsValidator] ERC20 transfer decoded:
                - From: ${from}
                - To: ${to}
                - Value: ${value}
                - Quest Type: ${config.questType}`);

              await handleERC20Quest(config.questId, { from, to, value });
              erc20Events++;
              break;
            }
            case EQuestTypes.SEND_NFT:
            case EQuestTypes.RECEIVE_NFT: {
              console.log(
                '🖼️  [ActionsValidator] Processing NFT transfer event...'
              );
              const decoded = decodeNFTTransferEvent(log);
              if (!decoded) {
                skippedEvents++;
                console.log(
                  `⏭️  [ActionsValidator] Skipped NFT event ${
                    index + 1
                  } - failed to decode`
                );
                continue;
              }
              const { from, to, tokenId } = decoded;
              console.log(`✅ [ActionsValidator] NFT transfer decoded:
                - From: ${from}
                - To: ${to}
                - Token ID: ${tokenId}
                - Quest Type: ${config.questType}`);

              await handleNFTQuest(config.questId, { from, to });
              nftEvents++;
              break;
            }
            default:
              console.log(
                `⚠️  [ActionsValidator] Unknown quest type: ${config.questType}`
              );
              skippedEvents++;
              continue;
          }

          const eventProcessDuration = Date.now() - eventProcessStartTime;
          processedEvents++;
          console.log(
            `✅ [ActionsValidator] Successfully processed event ${
              index + 1
            } in ${eventProcessDuration}ms`
          );

          // Update block progress if we've moved to a new block
          if (log.blockNumber !== lastProcessedBlockNumberInCurrentBatch) {
            await saveLastProcessedBlockNumber(log.blockNumber);
            lastProcessedBlockNumberInCurrentBatch = log.blockNumber;
            console.log(
              `💾 [ActionsValidator] Updated progress to block: ${log.blockNumber}`
            );
          }
        } catch (error) {
          errorEvents++;
          console.error(`❌ [ActionsValidator] Error processing event ${
            index + 1
          }:
            - Transaction: ${log.transactionHash}
            - Block: ${log.blockNumber}
            - Contract: ${log.address}
            - Error: ${error}
            - Stack: ${
              error instanceof Error ? error.stack : 'No stack trace'
            }`);
        }
      }

      // Final block number update
      await saveLastProcessedBlockNumber(endBlock);

      const totalDuration = Date.now() - parseStartTime;
      console.log(`🎉 [ActionsValidator] Batch processing completed:
        - Total events found: ${logs.length}
        - Successfully processed: ${processedEvents}
        - ERC20 events: ${erc20Events}
        - NFT events: ${nftEvents}
        - Skipped events: ${skippedEvents}
        - Error events: ${errorEvents}
        - Final processed block: ${endBlock}
        - Total duration: ${totalDuration}ms
        - Average time per event: ${
          processedEvents > 0 ? Math.round(totalDuration / processedEvents) : 0
        }ms`);
    } catch (error) {
      const totalDuration = Date.now() - parseStartTime;
      console.error(`💥 [ActionsValidator] Critical error in validation cycle:
        - Duration before error: ${totalDuration}ms
        - Error: ${error}
        - Stack: ${error instanceof Error ? error.stack : 'No stack trace'}
        - Network: ${ENetworks.ZETACHAIN}`);
    } finally {
      console.log(
        '⏰ [ActionsValidator] Scheduling next validation cycle in 10 seconds...'
      );
      setTimeout(parse, 10_000);
    }
  };

  const decodeERC20TransferEvent = (log: Log) => {
    console.log(`🔍 [ActionsValidator] Decoding ERC20 transfer event:
      - Transaction: ${log.transactionHash}
      - Block: ${log.blockNumber}
      - Contract: ${log.address}`);

    try {
      const iface = new Interface(ERC20_ABI);
      const parsed = iface.parseLog(log);

      if (!parsed || parsed.name !== 'Transfer') {
        console.log(`❌ [ActionsValidator] Failed to decode ERC20 transfer event:
          - Transaction: ${log.transactionHash}
          - Block: ${log.blockNumber}
          - Contract: ${log.address}
          - Expected event: 'Transfer'
          - Actual event: ${parsed?.name || 'null'}
          - Topics: ${JSON.stringify(log.topics)}
          - Data: ${log.data}`);
        return null;
      }

      const [from, to, value] = parsed.args;
      console.log(`✅ [ActionsValidator] Successfully decoded ERC20 transfer:
        - Transaction: ${log.transactionHash}
        - Event name: ${parsed.name}
        - Args count: ${parsed.args.length}`);

      return { from, to, value };
    } catch (error) {
      console.error(`💥 [ActionsValidator] Error decoding ERC20 transfer event:
        - Transaction: ${log.transactionHash}
        - Block: ${log.blockNumber}
        - Contract: ${log.address}
        - Error: ${error}
        - Stack: ${error instanceof Error ? error.stack : 'No stack trace'}
        - Log topics: ${JSON.stringify(log.topics)}
        - Log data: ${log.data}`);
      return null;
    }
  };

  const decodeNFTTransferEvent = (log: Log) => {
    console.log(`🔍 [ActionsValidator] Decoding NFT transfer event:
      - Transaction: ${log.transactionHash}
      - Block: ${log.blockNumber}
      - Contract: ${log.address}`);

    try {
      const iface = new Interface(ERC721_ABI);
      const parsed = iface.parseLog(log);

      if (!parsed || parsed.name !== 'Transfer') {
        console.log(`❌ [ActionsValidator] Failed to decode NFT transfer event:
          - Transaction: ${log.transactionHash}
          - Block: ${log.blockNumber}
          - Contract: ${log.address}
          - Expected event: 'Transfer'
          - Actual event: ${parsed?.name || 'null'}
          - Topics: ${JSON.stringify(log.topics)}
          - Data: ${log.data}`);
        return null;
      }

      const [from, to, tokenId] = parsed.args;
      console.log(`✅ [ActionsValidator] Successfully decoded NFT transfer:
        - Transaction: ${log.transactionHash}
        - Event name: ${parsed.name}
        - Args count: ${parsed.args.length}`);

      return { from, to, tokenId };
    } catch (error) {
      console.error(`💥 [ActionsValidator] Error decoding NFT transfer event:
        - Transaction: ${log.transactionHash}
        - Block: ${log.blockNumber}
        - Contract: ${log.address}
        - Error: ${error}
        - Stack: ${error instanceof Error ? error.stack : 'No stack trace'}
        - Log topics: ${JSON.stringify(log.topics)}
        - Log data: ${log.data}`);
      return null;
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
    console.log(`🔍 [ActionsValidator] Validating ERC20 quest criteria:
      - Expected from: ${expected.from || 'any'}
      - Actual from: ${actual.from}
      - Expected to: ${expected.to || 'any'}
      - Actual to: ${actual.to}
      - Expected value: ${expected.value || 'any'}
      - Actual value: ${actual.value}`);

    if (
      expected.from &&
      expected.from.toLowerCase() !== actual.from.toLowerCase()
    ) {
      console.log(`❌ [ActionsValidator] ERC20 validation failed - sender mismatch:
        - Expected from: ${expected.from}
        - Actual from: ${actual.from}`);
      return false;
    }

    if (expected.to && expected.to.toLowerCase() !== actual.to.toLowerCase()) {
      console.log(`❌ [ActionsValidator] ERC20 validation failed - recipient mismatch:
        - Expected to: ${expected.to}
        - Actual to: ${actual.to}`);
      return false;
    }

    if (expected.value && expected.value !== actual.value) {
      console.log(`❌ [ActionsValidator] ERC20 validation failed - value mismatch:
        - Expected value: ${expected.value}
        - Actual value: ${actual.value}`);
      return false;
    }

    console.log(
      '✅ [ActionsValidator] ERC20 quest validation successful - all criteria met'
    );
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
    const questStartTime = Date.now();
    console.log(`🔧 [ActionsValidator] Handling ERC20 quest validation:
      - Quest ID: ${questId}
      - From: ${actual.from}
      - To: ${actual.to}
      - Value: ${actual.value}`);

    try {
      console.log('🎯 [ActionsValidator] Looking up quest information...');
      const questLookupStartTime = Date.now();
      const [questInfo] = await db
        .select()
        .from(quests)
        .where(eq(quests.id, questId));
      const questLookupDuration = Date.now() - questLookupStartTime;

      if (!questInfo) {
        console.log(`❌ [ActionsValidator] Quest not found:
          - Quest ID: ${questId}
          - Lookup duration: ${questLookupDuration}ms`);
        return;
      }

      console.log(`✅ [ActionsValidator] Quest found:
        - Quest name: '${questInfo.name}'
        - Quest type: ${questInfo.questType}
        - Token address: ${questInfo.tokenAddress}
        - Expected amount: ${questInfo.amount}
        - Expected from: ${questInfo.fromAddress}
        - Expected to: ${questInfo.toAddress}
        - Lookup duration: ${questLookupDuration}ms`);

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
        console.log(`📤 [ActionsValidator] Processing SEND_ERC20 quest:
          - User wallet (sender): ${userWalletAddress}
          - Expected recipient: ${questInfo.toAddress}
          - Expected amount: ${questInfo.amount}`);
      } else if (questInfo.questType === EQuestTypes.RECEIVE_ERC20) {
        expectedResult = {
          from: questInfo.fromAddress,
          to: null,
          value: questInfo.amount ? BigInt(questInfo.amount) : null,
        };
        userWalletAddress = actual.to;
        console.log(`📥 [ActionsValidator] Processing RECEIVE_ERC20 quest:
          - User wallet (recipient): ${userWalletAddress}
          - Expected sender: ${questInfo.fromAddress}
          - Expected amount: ${questInfo.amount}`);
      } else {
        console.log(`❌ [ActionsValidator] Invalid quest type for ERC20 handling:
          - Quest ID: ${questId}
          - Quest type: ${questInfo.questType}
          - Expected: ${EQuestTypes.SEND_ERC20} or ${EQuestTypes.RECEIVE_ERC20}`);
        return;
      }

      console.log(
        '🔍 [ActionsValidator] Validating quest completion criteria...'
      );
      const validationStartTime = Date.now();
      const isQuestCompleted = await isERC20QuestCompleted(
        expectedResult,
        actual
      );
      const validationDuration = Date.now() - validationStartTime;

      if (!isQuestCompleted) {
        console.log(`❌ [ActionsValidator] Quest validation failed:
          - Quest ID: ${questId}
          - Quest name: '${questInfo.name}'
          - User wallet: ${userWalletAddress}
          - Validation duration: ${validationDuration}ms`);
        return;
      }

      console.log(`✅ [ActionsValidator] Quest validation successful:
        - Quest ID: ${questId}
        - Quest name: '${questInfo.name}'
        - User wallet: ${userWalletAddress}
        - Validation duration: ${validationDuration}ms`);

      console.log('🔄 [ActionsValidator] Updating quest status to CLAIM...');
      const statusUpdateStartTime = Date.now();
      await updateUserQuestStatusWithOptimisticLock(
        questId,
        userWalletAddress,
        EQuestStatuses.IN_PROGRESS,
        EQuestStatuses.CLAIM
      );
      const statusUpdateDuration = Date.now() - statusUpdateStartTime;

      const totalQuestDuration = Date.now() - questStartTime;
      console.log(`🎉 [ActionsValidator] ERC20 quest processing completed:
        - Quest ID: ${questId}
        - Quest name: '${questInfo.name}'
        - User wallet: ${userWalletAddress}
        - Status: IN_PROGRESS → CLAIM
        - Status update duration: ${statusUpdateDuration}ms
        - Total processing duration: ${totalQuestDuration}ms`);
    } catch (error) {
      const totalQuestDuration = Date.now() - questStartTime;
      console.error(`💥 [ActionsValidator] Error handling ERC20 quest:
        - Quest ID: ${questId}
        - User from: ${actual.from}
        - User to: ${actual.to}
        - Value: ${actual.value}
        - Duration before error: ${totalQuestDuration}ms
        - Error: ${error}
        - Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      throw error;
    }
  };

  export const handleNFTQuest = async (
    questId: string,
    actual: {
      from: string;
      to: string;
    }
  ) => {
    const questStartTime = Date.now();
    console.log(`🔧 [ActionsValidator] Handling NFT quest validation:
      - Quest ID: ${questId}
      - From: ${actual.from}
      - To: ${actual.to}`);

    try {
      console.log('🎯 [ActionsValidator] Looking up NFT quest information...');
      const questLookupStartTime = Date.now();
      const [questInfo] = await db
        .select()
        .from(quests)
        .where(eq(quests.id, questId));
      const questLookupDuration = Date.now() - questLookupStartTime;

      if (!questInfo) {
        console.log(`❌ [ActionsValidator] NFT quest not found:
          - Quest ID: ${questId}
          - Lookup duration: ${questLookupDuration}ms`);
        return;
      }

      console.log(`✅ [ActionsValidator] NFT quest found:
        - Quest name: '${questInfo.name}'
        - Quest type: ${questInfo.questType}
        - NFT address: ${questInfo.nftAddress}
        - Expected from: ${questInfo.fromAddress}
        - Expected to: ${questInfo.toAddress}
        - Lookup duration: ${questLookupDuration}ms`);

      let expectedResult: {
        from: string | null;
        to: string | null;
      };

      let userWalletAddress: string;
      if (questInfo.questType === EQuestTypes.SEND_NFT) {
        expectedResult = {
          from: null,
          to: questInfo.toAddress,
        };
        userWalletAddress = actual.from;
        console.log(`📤 [ActionsValidator] Processing SEND_NFT quest:
          - User wallet (sender): ${userWalletAddress}
          - Expected recipient: ${questInfo.toAddress}`);
      } else if (questInfo.questType === EQuestTypes.RECEIVE_NFT) {
        expectedResult = {
          from: questInfo.fromAddress,
          to: null,
        };
        userWalletAddress = actual.to;
        console.log(`📥 [ActionsValidator] Processing RECEIVE_NFT quest:
          - User wallet (recipient): ${userWalletAddress}
          - Expected sender: ${questInfo.fromAddress}`);
      } else {
        console.log(`❌ [ActionsValidator] Invalid quest type for NFT handling:
          - Quest ID: ${questId}
          - Quest type: ${questInfo.questType}
          - Expected: ${EQuestTypes.SEND_NFT} or ${EQuestTypes.RECEIVE_NFT}`);
        return;
      }

      console.log(
        '🔍 [ActionsValidator] Validating NFT quest completion criteria...'
      );
      const validationStartTime = Date.now();
      const isQuestCompleted = await isNFTQuestCompleted(
        expectedResult,
        actual
      );
      const validationDuration = Date.now() - validationStartTime;

      if (!isQuestCompleted) {
        console.log(`❌ [ActionsValidator] NFT quest validation failed:
          - Quest ID: ${questId}
          - Quest name: '${questInfo.name}'
          - User wallet: ${userWalletAddress}
          - Validation duration: ${validationDuration}ms`);
        return;
      }

      console.log(`✅ [ActionsValidator] NFT quest validation successful:
        - Quest ID: ${questId}
        - Quest name: '${questInfo.name}'
        - User wallet: ${userWalletAddress}
        - Validation duration: ${validationDuration}ms`);

      console.log(
        '🔄 [ActionsValidator] Updating NFT quest status to CLAIM...'
      );
      const statusUpdateStartTime = Date.now();
      await updateUserQuestStatusWithOptimisticLock(
        questId,
        userWalletAddress,
        EQuestStatuses.IN_PROGRESS,
        EQuestStatuses.CLAIM
      );
      const statusUpdateDuration = Date.now() - statusUpdateStartTime;

      const totalQuestDuration = Date.now() - questStartTime;
      console.log(`🎉 [ActionsValidator] NFT quest processing completed:
        - Quest ID: ${questId}
        - Quest name: '${questInfo.name}'
        - User wallet: ${userWalletAddress}
        - Status: IN_PROGRESS → CLAIM
        - Status update duration: ${statusUpdateDuration}ms
        - Total processing duration: ${totalQuestDuration}ms`);
    } catch (error) {
      const totalQuestDuration = Date.now() - questStartTime;
      console.error(`💥 [ActionsValidator] Error handling NFT quest:
        - Quest ID: ${questId}
        - User from: ${actual.from}
        - User to: ${actual.to}
        - Duration before error: ${totalQuestDuration}ms
        - Error: ${error}
        - Stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      throw error;
    }
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
    console.log(`🔍 [ActionsValidator] Validating NFT quest criteria:
      - Expected from: ${expected.from || 'any'}
      - Actual from: ${actual.from}
      - Expected to: ${expected.to || 'any'}
      - Actual to: ${actual.to}`);

    if (
      expected.from &&
      expected.from.toLowerCase() !== actual.from.toLowerCase()
    ) {
      console.log(`❌ [ActionsValidator] NFT validation failed - sender mismatch:
        - Expected from: ${expected.from}
        - Actual from: ${actual.from}`);
      return false;
    }

    if (expected.to && expected.to.toLowerCase() !== actual.to.toLowerCase()) {
      console.log(`❌ [ActionsValidator] NFT validation failed - recipient mismatch:
        - Expected to: ${expected.to}
        - Actual to: ${actual.to}`);
      return false;
    }

    console.log(
      '✅ [ActionsValidator] NFT quest validation successful - all criteria met'
    );
    return true;
  };
}

ActionsValidatorService.parse();
