import fs from 'fs';
import path from 'path';
import { getPool } from './pool';

const run = async (): Promise<void> => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query(sql);
    console.log('[CAMPUS] Schema aplicado com sucesso.');
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch((err: Error) => {
  console.error('[CAMPUS] Falha na migração:', err.message);
  process.exit(1);
});
