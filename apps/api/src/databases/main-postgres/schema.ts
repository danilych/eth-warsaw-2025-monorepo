import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuid_generate_v7()`);

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
const pgEnumTyped = <T extends string, U extends [T, ...T[]] = [T, ...T[]]>(
  name: string,
  values: T[]
) => pgEnum<T, U>(name, values as U);

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
const commonColumns = {
  id: id(),
  updatedAt: timestamp().$onUpdate(() => new Date()),
  createdAt: timestamp().defaultNow().notNull(),
  deletedAt: timestamp(),
};

export const questTypes = ['send', 'receive', 'nft'];
export const questStatuses = ['in_progress', 'completed'];

export const questTypeEnum = pgEnumTyped('quest_type', questTypes);
export const questStatusEnum = pgEnumTyped('quest_status', questStatuses);

export const users = pgTable('users', {
  ...commonColumns,
  walletAddress: text('wallet_address').notNull().unique(),
});

export const quests = pgTable('quests', {
  ...commonColumns,
  name: text().notNull(),
  description: text().notNull(),
  imageUrl: text('image_url'),
  questType: questTypeEnum('quest_type').notNull(),
  target: text().notNull(),
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
