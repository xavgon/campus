/**
 * Teste mTLS no WebSocket live — Task 1
 * Executa: node server/scripts/test-wss-mtls.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const CA = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY = fs.readFileSync(path.join(certsDir, 'client.key'));
const SRV_CERT = fs.readFileSync(path.join(certsDir, 'servidor.crt'));
const SRV_KEY = fs.readFileSync(path.join(certsDir, 'servidor.key'));

const connect = (label, expectedOpen, options) =>
  new Promise((resolve) => {
    const agent = new https.Agent({
      ca: CA,
      rejectUnauthorized: true,
      ...options,
    });

    const ws = new WebSocket(
      'wss://localhost:3001/live?token=invalid&role=listener',
      { agent },
    );

    let opened = false;
    const timer = setTimeout(() => {
      ws.terminate();
      const ok = !expectedOpen;
      console.log(`${ok ? '✅' : '❌'} ${label}`);
      console.log(`   ${expectedOpen ? 'Esperava abrir' : 'Esperava falhar'} — timeout`);
      resolve();
    }, 4000);

    ws.on('open', () => {
      opened = true;
      clearTimeout(timer);
      ws.close();
    });

    ws.on('close', (code) => {
      clearTimeout(timer);
      if (expectedOpen) {
        const ok = opened;
        console.log(`${ok ? '✅' : '❌'} ${label}`);
        console.log(
          ok
            ? `   mTLS OK — ligação estabelecida, fechada com código ${code} (JWT inválido no teste)`
            : `   Ligação não abriu — código ${code}`,
        );
      } else {
        const ok = code === 1008 || !opened;
        console.log(`${ok ? '✅' : '❌'} ${label}`);
        console.log(
          ok
            ? `   Cert inválido rejeitado — código ${code}`
            : `   Esperava rejeição (1008) — abriu=${opened}, código ${code}`,
        );
      }
      resolve();
    });

    ws.on('error', (err) => {
      clearTimeout(timer);
      const ok = !expectedOpen;
      console.log(`${ok ? '✅' : '❌'} ${label}`);
      console.log(`   Erro: ${err.message}`);
      resolve();
    });
  });

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste mTLS WebSocket Live (Task 1)');
console.log('══════════════════════════════════════════════\n');

await connect(
  'Cenário 1 — WS com certificado válido (client.crt)',
  true,
  { cert: CLI_CERT, key: CLI_KEY },
);

await connect(
  'Cenário 2 — WS com cert inválido (servidor.crt sem clientAuth)',
  false,
  { cert: SRV_CERT, key: SRV_KEY },
);

console.log('\n══════════════════════════════════════════════');
console.log(' Nota: em dev, localhost sem cert usa allowlist (HTTP).');
console.log(' O WS exige o mesmo mTLS que a API quando TLS está activo.');
console.log('══════════════════════════════════════════════\n');
