import { sql } from 'drizzle-orm';
import {
  numeric,
  pgEnum,
  timestamp,
  uuid,
  pgTable,
  varchar,
  bigint,
  text,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { ENetworks } from 'lib/enums/networks';
import { EActions } from 'lib/enums/actions';

const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuid_generate_v7()`);

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
const fundsAmount = () => numeric({ precision: 65, scale: 25 });

const pgEnumTyped = <T extends string, U extends [T, ...T[]] = [T, ...T[]]>(
  name: string,
  values: T[]
) => pgEnum<T, U>(name, values as U);

const commonColumns = {
  id: id(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
  createdAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

// Blockchain parser enums
const blockchainNetworkEnum = pgEnumTyped(
  'blockchain_network',
  Object.values(ENetworks)
);

const parsingStatusEnum = pgEnumTyped('parsing_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'retrying',
]);

// Action validation enums
const actionTypeEnum = pgEnumTyped('action_type', Object.values(EActions));

const actionStatusEnum = pgEnumTyped('action_status', [
  'pending',
  'validating',
  'valid',
  'invalid',
  'error',
]);

// Blockchain parser state table - tracks the last processed block for each network
export const blockchainParserState = pgTable(
  'blockchain_parser_state',
  {
    ...commonColumns,
    network: blockchainNetworkEnum().notNull().unique(),
    lastProcessedBlock: bigint({ mode: 'number' }).notNull().default(0),
  },
  (table) => ({
    networkIdx: index('blockchain_parser_state_network_idx').on(table.network),
  })
);

// Block processing jobs table - tracks individual block processing tasks
export const blockProcessingJobs = pgTable(
  'block_processing_jobs',
  {
    ...commonColumns,
    network: blockchainNetworkEnum().notNull(),
    blockNumber: bigint({ mode: 'number' }).notNull(),
    blockHash: varchar({ length: 66 }).notNull(),
    status: parsingStatusEnum().notNull().default('pending'),
    startedAt: timestamp(),
    completedAt: timestamp(),
    retryCount: bigint({ mode: 'number' }).notNull().default(0),
    maxRetries: bigint({ mode: 'number' }).notNull().default(3),
    error: text(),
    blockData: jsonb(),
    transactionsProcessed: bigint({ mode: 'number' }).notNull().default(0),
    eventsProcessed: bigint({ mode: 'number' }).notNull().default(0),
    processingTimeMs: bigint({ mode: 'number' }),
  },
  (table) => [
    index('block_processing_jobs_network_block_idx').on(
      table.network,
      table.blockNumber
    ),
    index('block_processing_jobs_status_idx').on(table.status),
    index('block_processing_jobs_block_hash_idx').on(table.blockHash),
  ]
);

// Action validation state table - tracks the last processed action for each action type
export const actionValidationState = pgTable(
  'action_validation_state',
  {
    ...commonColumns,
    actionType: actionTypeEnum().notNull().unique(),
    lastProcessedActionId: varchar({ length: 255 }),
    lastProcessedAt: timestamp(),
  },
  (table) => ({
    actionTypeIdx: index('action_validation_state_action_type_idx').on(
      table.actionType
    ),
  })
);

// Action validation jobs table - tracks individual action validation tasks
export const actionValidationJobs = pgTable(
  'action_validation_jobs',
  {
    ...commonColumns,
    actionId: varchar({ length: 255 }).notNull(),
    actionType: actionTypeEnum().notNull(),
    actionData: jsonb().notNull(),
    status: actionStatusEnum().notNull().default('pending'),
    validatedAt: timestamp(),
    validationError: text(),
    retryCount: bigint({ mode: 'number' }).notNull().default(0),
    maxRetries: bigint({ mode: 'number' }).notNull().default(3),
    validationTimeMs: bigint({ mode: 'number' }),
  },
  (table) => [
    index('action_validation_jobs_action_id_idx').on(table.actionId),
    index('action_validation_jobs_action_type_idx').on(table.actionType),
    index('action_validation_jobs_status_idx').on(table.status),
  ]
);

// Game status enum
const gameStatusEnum = pgEnumTyped('game_status', [
  'created',
  'in_progress',
  'finished',
  'cancelled',
]);

// Bet status enum
const betStatusEnum = pgEnumTyped('bet_status', [
  'active',
  'withdraw_available',
  'jackpot_withdraw_available',
  'withdrawn',
  'cancelled',
]);

// Games table
export const games = pgTable(
  'games',
  {
    ...commonColumns,
    gameId: bigint({ mode: 'number' }).notNull().unique(),
    name: varchar({ length: 255 }).notNull(),
    contractAddress: varchar({ length: 42 }).notNull(),
    hostAddress: varchar({ length: 42 }).notNull(),
    network: blockchainNetworkEnum().notNull(),
    minDeposit: numeric({ precision: 65, scale: 25 }).notNull(),
    maxDeposit: numeric({ precision: 65, scale: 25 }).notNull(),
    roi: numeric({ precision: 5, scale: 2 }).notNull(),
    fee: numeric({ precision: 5, scale: 2 }).notNull(),
    thumbnailUrl: text(),
    status: gameStatusEnum().notNull().default('created'),
    blockNumber: bigint({ mode: 'number' }).notNull(),
  },
  (table) => [
    index('games_game_id_idx').on(table.gameId),
    index('games_contract_address_idx').on(table.contractAddress),
    index('games_host_address_idx').on(table.hostAddress),
    index('games_status_idx').on(table.status),
    index('games_network_idx').on(table.network),
  ]
);

// Bets table
export const bets = pgTable(
  'bets',
  {
    ...commonColumns,
    betId: varchar({ length: 255 }).notNull().unique(),
    gameId: bigint({ mode: 'number' }).notNull(),
    walletAddress: varchar({ length: 42 }).notNull(),
    amount: numeric({ precision: 65, scale: 25 }).notNull(),
    status: betStatusEnum().notNull().default('active'),
    blockNumber: bigint({ mode: 'number' }).notNull(),
    transactionHash: varchar({ length: 66 }),
    network: blockchainNetworkEnum().notNull(),
  },
  (table) => [
    index('bets_bet_id_idx').on(table.betId),
    index('bets_game_id_idx').on(table.gameId),
    index('bets_wallet_address_idx').on(table.walletAddress),
    index('bets_status_idx').on(table.status),
    index('bets_network_idx').on(table.network),
  ]
);

// Blockchain events table - stores raw blockchain event data
export const blockchainEvents = pgTable(
  'blockchain_events',
  {
    ...commonColumns,
    network: blockchainNetworkEnum().notNull(),
    blockNumber: bigint({ mode: 'number' }).notNull(),
    blockHash: varchar({ length: 66 }).notNull(),
    transactionHash: varchar({ length: 66 }).notNull(),
    logIndex: bigint({ mode: 'number' }).notNull(),
    address: varchar({ length: 42 }).notNull(),
    eventName: varchar({ length: 100 }).notNull(),
    eventData: jsonb().notNull(),
    processed: timestamp(),
    processingError: text(),
  },
  (table) => [
    index('blockchain_events_network_block_idx').on(
      table.network,
      table.blockNumber
    ),
    index('blockchain_events_address_idx').on(table.address),
    index('blockchain_events_event_name_idx').on(table.eventName),
    index('blockchain_events_tx_hash_idx').on(table.transactionHash),
    index('blockchain_events_processed_idx').on(table.processed),
  ]
);
