import { ensureSchemaPatches } from './ensureSchemaPatches';
import { getPool } from './pool';
import { ensureDefaultAdmin } from './seedAdmin';

const run = async (): Promise<void> => {
  await ensureSchemaPatches();
  await ensureDefaultAdmin();
  console.info('[CAMPUS] Seed concluído.');
  await getPool().end();
};

run().catch((err: Error) => {
  console.error('[CAMPUS] Falha no seed:', err.message);
  process.exit(1);
});
