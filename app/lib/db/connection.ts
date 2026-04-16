import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Cache the pool on globalThis so it survives Next.js HMR reloads.
// Without this, every hot reload creates a new pool without closing the old one,
// quickly exhausting the MySQL connection limit.
const globalForDb = globalThis as unknown as {
  __dbPool: mysql.Pool | undefined;
  __db: ReturnType<typeof drizzle> | undefined;
};

function getDb() {
  if (globalForDb.__db) return globalForDb.__db;

  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'provisioning_db',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });

    globalForDb.__dbPool = pool;
    globalForDb.__db = drizzle(pool, { schema, mode: 'default' });
    return globalForDb.__db;
  } catch (err) {
    console.error('Failed to initialize database:', err);
    return null;
  }
}

const db = getDb();

export { db };
