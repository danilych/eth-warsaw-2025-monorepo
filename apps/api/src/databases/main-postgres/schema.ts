import { sql } from 'drizzle-orm';
import { numeric, pgEnum, timestamp, uuid } from 'drizzle-orm/pg-core';

const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuid_generate_v7()`);

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
const fundsAmount = () => numeric({ precision: 65, scale: 25 });

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
