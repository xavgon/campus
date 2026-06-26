/**
 * Executa todos os testes RF01–RF14 em sequência.
 * Pré-requisito: servidor em https://localhost:3001 (npm run dev).
 *
 * Uso: node server/scripts/run-all-rf-tests.mjs
 */
import { spawn } from 'child_process';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const CA = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY = fs.readFileSync(path.join(certsDir, 'client.key'));

const RF_TESTS = [
  'test-rf01-auth',
  'test-rf02-profile',
  'test-rf03-upload',
  'test-rf04-storage',
  'test-rf05-compression',
  'test-rf06-streaming',
  'test-rf07-vod',
  'test-rf08-player',
  'test-rf09-search',
  'test-rf10-catalog',
  'test-rf11-download',
  'test-rf12-permissions',
  'test-rf13-activity',
  'test-rf14-api',
];

const waitForServer = (attempts = 30, delayMs = 2000) =>
  new Promise((resolve, reject) => {
    let tries = 0;

    const ping = () => {
      const req = https.request(
        {
          hostname: 'localhost',
          port: 3001,
          path: '/api/health',
          method: 'GET',
          rejectUnauthorized: false,
          cert: CLI_CERT,
          key: CLI_KEY,
          ca: CA,
        },
        (res) => {
          res.resume();
          if (res.statusCode === 200) {
            resolve();
            return;
          }
          retry();
        },
      );
      req.on('error', () => retry());
      req.end();
    };

    const retry = () => {
      tries += 1;
      if (tries >= attempts) {
        reject(new Error('Servidor não respondeu em https://localhost:3001 — corre npm run dev na pasta server.'));
        return;
      }
      setTimeout(ping, delayMs);
    };

    ping();
  });

const runScript = (scriptName) =>
  new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, `${scriptName}.mjs`)], {
      stdio: 'inherit',
      shell: false,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} falhou (exit ${code})`));
    });
  });

const run = async () => {
  console.log('\n=== CAMPUS — Suite RF01–RF14 ===\n');
  console.log('A aguardar servidor…');
  await waitForServer();
  console.log('Servidor activo.\n');

  let failures = 0;
  for (const script of RF_TESTS) {
    try {
      await runScript(script);
    } catch (err) {
      failures += 1;
      console.error(`\n❌ ${script}: ${err.message}\n`);
    }
  }

  console.log(`\n--- Suite: ${failures === 0 ? 'TODOS OS RF OK' : `${failures} módulo(s) falharam`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
