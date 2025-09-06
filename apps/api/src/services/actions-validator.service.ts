import { ENetworks } from 'lib/enums/networks';
import { blockchainParserState } from '../databases/main-postgres/schema';
import { eq } from 'drizzle-orm';
import { db } from '../databases/main-postgres';
import { CONFIG } from '../config';
import { EvmService } from './blockchain/evm.service';

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

      //   TODO: get current active quests and include their addresses into query
      const logs = await EvmService.getLogsInBlockRange(
        provider,
        [CONFIG.PARSING.ARBITRUM.CONTRACT_ADDRESS],
        startBlock,
        endBlock
      );
      // TODO: parse event from smart contract and execute corresponding handler for the action

      let lastProcessedBlockNumberInCurrentBatch = startBlock;
      for (const log of logs) {
        console.log(log);

        if (log.blockNumber !== lastProcessedBlockNumberInCurrentBatch) {
          await saveLastProcessedBlockNumber(log.blockNumber);
          lastProcessedBlockNumberInCurrentBatch = log.blockNumber;
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
}
