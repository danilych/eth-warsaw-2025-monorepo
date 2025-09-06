import { sql } from 'drizzle-orm';
import {
  pgEnum,
  timestamp,
  uuid,
  pgTable,
  bigint,
  text,
  index,
  integer,
  numeric,
} from 'drizzle-orm/pg-core';
import { ENetworks } from 'lib/enums/networks';
import { EQuestTypes, EQuestStatuses } from 'lib/enums/quests';

const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuid_generate_v7()`);

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

export const questTypeEnum = pgEnumTyped(
  'quest_type',
  Object.values(EQuestTypes)
);
export const questStatusEnum = pgEnumTyped(
  'quest_status',
  Object.values(EQuestStatuses)
);

export const users = pgTable('users', {
  ...commonColumns,
  walletAddress: text('wallet_address').notNull().unique(),
});

export const quests = pgTable('quests', {
  ...commonColumns,
  name: text('name').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  questType: questTypeEnum('quest_type').notNull(),
  rewardAmount: bigint('reward_amount', { mode: 'bigint' }).notNull(),
  rewardTokenAddress: text('reward_token_address').notNull(),
  expiry: integer('expiry').notNull().default(0),
  fromAddress: text('from_address'),
  toAddress: text('to_address'),
  amount: numeric('amount'),
  tokenAddress: text('token_address'),
  nftAddress: text('nft_address'),
});

export const userQuests = pgTable('user_quests', {
  ...commonColumns,
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  questId: uuid('quest_id')
    .notNull()
    .references(() => quests.id),
  status: questStatusEnum('quest_status').notNull(),
});
// Blockchain parser enums
export const blockchainNetworkEnum = pgEnumTyped(
  'blockchain_network',
  Object.values(ENetworks)
);

// Blockchain parser state table - tracks the last processed block for each network
export const blockchainParserState = pgTable(
  'blockchain_parser_state',
  {
    ...commonColumns,
    network: blockchainNetworkEnum().notNull().unique(),
    lastProcessedBlock: bigint({ mode: 'number' }).notNull().default(0),
  },
  (table) => [index('blockchain_parser_state_network_idx').on(table.network)]
);
