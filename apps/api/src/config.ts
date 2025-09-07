export const CONFIG = {
  QUEST_CONTRACT_ADDRESS: '0x8e5Ac2A5F2f854467590c30f08f4134e87515Fb4',
  PARSING: {
    ARBITRUM: {
      RPC_URL: 'https://arbitrum-sepolia.gateway.tenderly.co',
      CLAIMER_CONTRACT_ADDRESS: '0x2d02956B201889A00CFf7B20bDEff13E69EcF1f4',
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
