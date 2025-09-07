export const CONFIG = {
  PARSING: {
    ARBITRUM: {
      RPC_URL: 'https://arbitrum-sepolia.gateway.tenderly.co',
      CLAIMER_CONTRACT_ADDRESS: '0x0000000000000000000000000000000000000000',
      EVENT_SIGNATURE: '0x0000000000000000000000000000000000000000',
      START_BLOCK: 0,
      MAX_BLOCKS_TO_PROCESS: 500,
    },
    ZETACHAIN: {
      RPC_URL: 'https://zetachain-testnet.public.blastapi.io',
      START_BLOCK: 0,
    },
  },

  GOLEM: {
    CHAIN_ID: 60138453033,
    RPC_URL: 'https://ethwarsaw.holesky.golemdb.io/rpc',
    WS_URL: 'wss://ethwarsaw.holesky.golemdb.io/rpc/ws',
  },
} as const;
