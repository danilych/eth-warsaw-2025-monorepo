import { JsonRpcProvider } from 'ethers';
import type { ENetworks } from 'lib/enums/networks';
import { CONFIG } from '../../config';

export namespace EvmService {
  export const getJsonRpcProvider = (network: ENetworks) => {
    const networkKey = network.toUpperCase() as keyof typeof CONFIG.PARSING;
    const rpcUrl = CONFIG.PARSING[networkKey]?.RPC_URL;
    if (!rpcUrl) {
      throw new Error(`RPC URL for network ${network} not found`);
    }
    return new JsonRpcProvider(rpcUrl);
  };

  export const getCurrentBlockNumber = async (provider: JsonRpcProvider) => {
    const block = await provider.getBlockNumber();
    return block;
  };

  export const getLogsInBlockRange = async (
    provider: JsonRpcProvider,
    contractAddresses: string[],
    fromBlock: number,
    toBlock: number
  ) => {
    const logs = await provider.getLogs({
      address: contractAddresses,
      fromBlock,
      toBlock,
    });
    return logs;
  };
}
