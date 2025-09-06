import { JsonRpcProvider } from 'ethers';
import type { ENetworks } from 'lib/enums/networks';

export namespace EvmService {
  export const getJsonRpcProvider = (network: ENetworks) => {
    return new JsonRpcProvider(network);
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
