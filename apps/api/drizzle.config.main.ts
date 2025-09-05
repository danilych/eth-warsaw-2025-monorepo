import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  out: './src/databases/main-postgres/migrations',
  schema: './src/databases/main-postgres/schema.ts',
  dialect: 'postgresql',
  casing: 'snake_case',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
