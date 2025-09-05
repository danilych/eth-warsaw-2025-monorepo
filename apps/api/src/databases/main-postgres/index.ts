import {
  type NodePgDatabase,
  drizzle as drizzleNodePg,
} from 'drizzle-orm/node-postgres';
import { Pool as PoolTcp } from 'pg';
import * as schema from './schema';

export type DatabaseTypeBase = NodePgDatabase<typeof schema>;

const drizzleOpts = {
  casing: 'snake_case' as const,
  schema,
};

export const initDB = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  const mainDb = drizzleNodePg(
    new PoolTcp({ connectionString: dbUrl }),
    drizzleOpts
  );

  return mainDb;
};

export const db = initDB();
