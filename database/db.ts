import { Pool, PoolClient } from 'pg';
import { config } from 'dotenv';
config()
console.log(process.env.DATABASE_URL)
// Use DATABASE_URL directly (Next.js automatically loads .env.local)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

export const query = (text: string, params?: unknown[]) => pool.query(text, params);

export const getClient = (): Promise<PoolClient> => pool.connect();

export const closePool = () => pool.end();

export default pool;
