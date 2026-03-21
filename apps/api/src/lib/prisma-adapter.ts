import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

export const sqliteAdapter = new PrismaBetterSqlite3({
  url: databaseUrl,
});
