/**
 * Script de teste mTLS — Task 1 / Task 2
 * Executa: node server/scripts/test-mtls.mjs
 *
 * Detecta MTLS_STRICT via cabeçalho X-Campus-MTLS-Strict do servidor.
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const CA = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY = fs.readFileSync(path.join(certsDir, 'client.key'));
const SRV_CERT = fs.readFileSync(path.join(certsDir, 'servidor.crt'));
const SRV_KEY = fs.readFileSync(path.join(certsDir, 'servidor.key'));

const request = (label, expectedCode, options) =>
  new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/health',
        method: 'GET',
        rejectUnauthorized: false,
        ...options,
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          const ok = res.statusCode === expectedCode;
          console.log(`${ok ? '✅' : '❌'} ${label}`);
          console.log(
            `   HTTP ${res.statusCode} (esperado: ${expectedCode}) ${ok ? '— CORRECTO' : '— ERRO'}`,
          );
          try {
            if (!ok || res.statusCode !== 200) {
              console.log(`   → ${JSON.parse(body).message}`);
            }
          } catch {
            /**/
          }
          resolve({ status: res.statusCode, headers: res.headers });
        });
      },
    );
    req.on('error', (e) => {
      const ok = expectedCode === 0;
      console.log(`${ok ? '✅' : '❌'} ${label}`);
      console.log(`   ERRO TLS — ${e.message}`);
      resolve({ status: 0, headers: {} });
    });
    req.end();
  });

const detectMtlsStrict = () =>
  new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/health',
        method: 'GET',
        rejectUnauthorized: false,
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          resolve(res.headers['x-campus-mtls-strict'] === 'true');
        });
      },
    );
    req.on('error', () => resolve(false));
    req.end();
  });

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste mTLS (Task 1 / Task 2)');
console.log('══════════════════════════════════════════════\n');

const strict = await detectMtlsStrict();
console.log(
  strict
    ? 'ℹ️  Servidor em MTLS_STRICT — sem certificado → 401 (produção)\n'
    : 'ℹ️  Servidor permissivo (dev) — localhost na allowlist → 200 sem cert\n',
);

await request(
  strict
    ? 'Cenário 1 — Sem certificado (MTLS_STRICT — bloqueado)'
    : 'Cenário 1 — Sem certificado (localhost/dev allowlist)',
  strict ? 401 : 200,
  {},
);

await request('Cenário 2 — Certificado válido (client.crt assinado pela CA)', 200, {
  cert: CLI_CERT,
  key: CLI_KEY,
  ca: CA,
});

await request('Cenário 3 — Cert inválido (servidor.crt sem EKU clientAuth)', 403, {
  cert: SRV_CERT,
  key: SRV_KEY,
  ca: CA,
});

console.log('\n══════════════════════════════════════════════');
console.log('Resultados:');
console.log('  ✅ = resultado correcto (HTTP code corresponde ao esperado)');
console.log('  ❌ = resultado inesperado (investigar)');
if (!strict) {
  console.log('\n  Dica: MTLS_STRICT=true no .env do servidor para testar modo produção.');
}
console.log('══════════════════════════════════════════════\n');
