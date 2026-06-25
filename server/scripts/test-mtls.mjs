/**
 * Script de teste mTLS — Task 1 / Task 2
 * Executa: node server/scripts/test-mtls.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const CA  = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY  = fs.readFileSync(path.join(certsDir, 'client.key'));
const SRV_CERT = fs.readFileSync(path.join(certsDir, 'servidor.crt'));
const SRV_KEY  = fs.readFileSync(path.join(certsDir, 'servidor.key'));

const request = (label, expectedCode, options) =>
  new Promise((resolve) => {
    const req = https.request({ hostname: 'localhost', port: 3001, path: '/api/health', method: 'GET', rejectUnauthorized: false, ...options }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        const ok = res.statusCode === expectedCode;
        console.log(`${ok ? '✅' : '❌'} ${label}`);
        console.log(`   HTTP ${res.statusCode} (esperado: ${expectedCode}) ${ok ? '— CORRECTO' : '— ERRO'}`);
        try { if (!ok || res.statusCode !== 200) console.log(`   → ${JSON.parse(body).message}`); } catch { /**/ }
        resolve(res.statusCode);
      });
    });
    req.on('error', (e) => {
      const ok = expectedCode === 0;
      console.log(`${ok ? '✅' : '❌'} ${label}`);
      console.log(`   ERRO TLS — ${e.message}`);
      resolve(0);
    });
    req.end();
  });

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste mTLS (Task 1 / Task 2)');
console.log('══════════════════════════════════════════════\n');

// Cenário 1: sem certificado de cliente → allowlist localhost (dev) → 200
await request('Cenário 1 — Sem certificado (localhost/dev allowlist)', 200, {});

// Cenário 2: certificado válido assinado pela CA + EKU clientAuth → 200
await request('Cenário 2 — Certificado válido (client.crt assinado pela CA)', 200,
  { cert: CLI_CERT, key: CLI_KEY, ca: CA });

// Cenário 3: cert do servidor usado como client cert → 403 (EKU errado)
await request('Cenário 3 — Cert inválido (servidor.crt sem EKU clientAuth)', 403,
  { cert: SRV_CERT, key: SRV_KEY, ca: CA });

console.log('\n══════════════════════════════════════════════');
console.log('Resultados:');
console.log('  ✅ = resultado correcto (HTTP code corresponde ao esperado)');
console.log('  ❌ = resultado inesperado (investigar)');
console.log('══════════════════════════════════════════════\n');
