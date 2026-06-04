import { Pool } from 'pg';
import { config } from '../config';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  return pool;
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await getPool().connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch {
    return false;
  }
};
