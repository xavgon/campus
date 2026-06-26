/**
 * Script de demonstração — Task 7 (Mitigação de Ataques MITM)
 * Executa: node server/scripts/test-mitm-protection.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const CA_REAL = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY = fs.readFileSync(path.join(certsDir, 'client.key'));

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (detail) console.log(`   → ${detail}`);
};

const tlsInfo = (res) => {
  const socket = res.socket;
  if (!socket || typeof socket.getProtocol !== 'function') {
    return { version: 'n/a', cipher: 'n/a' };
  }
  return {
    version: socket.getProtocol() ?? 'n/a',
    cipher: socket.getCipher?.()?.name ?? 'n/a',
  };
};

const request = (label, expectedOutcome, opts) =>
  new Promise((resolve) => {
    const r = https.request(
      { hostname: 'localhost', port: 3001, path: '/api/health', method: 'GET', ...opts },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = null;
          }

          const { version, cipher } = tlsInfo(res);
          const caHeader = res.headers['x-campus-ca'] ?? '(sem cabeçalho)';
          const hsts = res.headers['strict-transport-security'] ?? null;

          if (expectedOutcome === 'success') {
            check(label, res.statusCode === 200, `HTTP ${res.statusCode}`);
            console.log(`   TLS: ${version} | Cifra: ${cipher}`);
            console.log(`   X-Campus-CA: ${caHeader}`);
            if (hsts) console.log(`   HSTS: ${hsts}`);
          } else {
            check(`${label} — deveria ter falhado`, false, 'vulnerabilidade');
          }

          resolve({
            ok: expectedOutcome === 'success' && res.statusCode === 200,
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            tls: { version, cipher },
          });
        });
      },
    );
    r.on('error', (e) => {
      if (expectedOutcome === 'tls-error') {
        check(label, true, e.code ?? e.message);
        console.log('   → Ataque MITM detectado e bloqueado');
      } else {
        check(`${label} — erro inesperado`, false, e.message);
      }
      resolve({ ok: expectedOutcome === 'tls-error', error: e.message });
    });
    r.end();
  });

console.log('\n══════════════════════════════════════════════════════');
console.log(' CAMPUS — Demonstração de Protecção MITM (Task 7)');
console.log('══════════════════════════════════════════════════════\n');

console.log('Cenário A — Ligação legítima (cliente verifica CA-CAMPUS):');
const legit = await request('Cliente com CA correcta', 'success', {
  rejectUnauthorized: true,
  ca: CA_REAL,
  cert: CLI_CERT,
  key: CLI_KEY,
});
check('Resposta inclui bloco security', !!legit.body?.data?.security?.mitmProtection);
check('minTlsVersion = TLSv1.2', legit.body?.data?.security?.minTlsVersion === 'TLSv1.2');

console.log('\nCenário B — Sem verificação de CA (rejectUnauthorized: false):');
console.log('⚠️  Simula -k / --insecure (vulnerável a MITM)');
await request('Ligação sem verificar CA', 'success', {
  rejectUnauthorized: false,
  cert: CLI_CERT,
  key: CLI_KEY,
});

console.log('\nCenário C — CA errada (atacante MITM com cert falso):');
const fakeCaBuffer = Buffer.from(
  '-----BEGIN CERTIFICATE-----\nZmFrZWNlcnQ=\n-----END CERTIFICATE-----\n',
);
await request('CA do atacante rejeitada', 'tls-error', {
  rejectUnauthorized: true,
  ca: fakeCaBuffer,
  cert: CLI_CERT,
  key: CLI_KEY,
});

console.log('\nCenário D — HSTS e cabeçalhos de segurança:');
check('Cabeçalho HSTS presente', !!legit.headers?.['strict-transport-security']);
check('X-Campus-CA presente', legit.headers?.['x-campus-ca'] === 'CA-CAMPUS/ISPTEC');
const hsts = legit.headers?.['strict-transport-security'] ?? '';
check('HSTS inclui max-age', hsts.includes('max-age'));
check('HSTS inclui includeSubDomains', hsts.includes('includeSubDomains'));

console.log('\n══════════════════════════════════════════════════════');
console.log(' Camadas anti-MITM (Task 7):');
console.log('   • TLS 1.2+ + cifras ECDHE (PFS)');
console.log('   • CA-CAMPUS no Vite proxy, Electron e testes');
console.log('   • HSTS — sem downgrade HTTP');
console.log('   • UI: Perfil → Ligação segura (anti-MITM)');
console.log('══════════════════════════════════════════════════════\n');
