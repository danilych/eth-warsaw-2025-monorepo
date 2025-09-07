export const CONFIG = {
  QUEST_CONTRACT_ADDRESS: '0xf364CFa2D38Cd82Bf01d9281E90f945b481a0c46',
  PARSING: {
    ARBITRUM: {
      RPC_URL: 'https://arbitrum-sepolia.gateway.tenderly.co',
      CLAIMER_CONTRACT_ADDRESS: '0xAd51FCfE8feEBDCd29CD8C91880D6AAe5051B19E',
      START_BLOCK: 191729652,
      MAX_BLOCKS_TO_PROCESS: 500,
    },
    ZETACHAIN: {
      RPC_URL: 'https://zetachain-testnet.public.blastapi.io',
      START_BLOCK: 0,
      MAX_BLOCKS_TO_PROCESS: 500,
    },
  },

  GOLEM: {
    CHAIN_ID: 60138453033,
    RPC_URL: 'https://ethwarsaw.holesky.golemdb.io/rpc',
    WS_URL: 'wss://ethwarsaw.holesky.golemdb.io/rpc/ws',
  },
} as const;
