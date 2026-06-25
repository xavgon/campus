/**
 * Script de emissão de certificado de cliente — Task 4 (Gestão de CA)
 *
 * Gera um novo certificado de cliente assinado pela CA-CAMPUS e
 * regista-o no servidor via API.
 *
 * Uso:
 *   node server/scripts/issue-client-cert.mjs <cn> <destino>
 *
 * Exemplo:
 *   node server/scripts/issue-client-cert.mjs pacavira-laptop pacavira@campus.co.ao
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

// Localizar openssl: PATH, Git para Windows, ou WSL
const findOpenSSL = () => {
  const candidates = [
    'openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe',
  ];
  for (const bin of candidates) {
    try { execSync(`"${bin}" version`, { stdio: 'pipe' }); return bin; } catch { /**/ }
  }
  throw new Error(
    'openssl não encontrado. Instala Git para Windows (https://git-scm.com) ou adiciona openssl ao PATH.',
  );
};
const OPENSSL = findOpenSSL();

const cn     = process.argv[2];
const destTo = process.argv[3];

if (!cn || !destTo) {
  console.error('Uso: node server/scripts/issue-client-cert.mjs <cn> <destino>');
  console.error('Ex:  node server/scripts/issue-client-cert.mjs pacavira-laptop pacavira@campus.co.ao');
  process.exit(1);
}

const safeCn = cn.replace(/[^a-zA-Z0-9_-]/g, '_');
const keyOut  = path.join(certsDir, `${safeCn}.key`);
const csrOut  = path.join(certsDir, `${safeCn}.csr`);
const crtOut  = path.join(certsDir, `${safeCn}.crt`);
const extFile = path.join(certsDir, 'client_ext.cnf');
const caKey   = path.join(certsDir, 'ca.key');
const caCrt   = path.join(certsDir, 'ca.crt');

console.log('\n══════════════════════════════════════════════');
console.log(` CA-CAMPUS — Emitir Certificado de Cliente`);
console.log('══════════════════════════════════════════════');
console.log(` CN:      ${cn}`);
console.log(` Destino: ${destTo}`);
console.log(` Ficheiros: ${safeCn}.key / ${safeCn}.crt`);
console.log('');

// 1. Gerar chave privada
console.log('1. Gerar chave privada RSA-2048…');
execSync(`"${OPENSSL}" genrsa -out "${keyOut}" 2048`, { stdio: 'pipe' });
console.log(`   ✅ ${keyOut}`);

// 2. Gerar CSR
console.log(`2. Gerar CSR (CN=${cn})…`);
execSync(
  `"${OPENSSL}" req -new -key "${keyOut}" -out "${csrOut}" -subj "/CN=${cn}/O=ISPTEC/C=AO"`,
  { stdio: 'pipe' },
);
console.log(`   ✅ ${csrOut}`);

// 3. Assinar com a CA
console.log('3. Assinar com CA-CAMPUS (clientAuth EKU)…');
execSync(
  `"${OPENSSL}" x509 -req -in "${csrOut}" -CA "${caCrt}" -CAkey "${caKey}" -CAcreateserial ` +
  `-out "${crtOut}" -days 365 -sha256 -extfile "${extFile}" -extensions client_ext`,
  { stdio: 'pipe' },
);
console.log(`   ✅ ${crtOut}`);

// 4. Obter fingerprint
const fp = execSync(
  `"${OPENSSL}" x509 -in "${crtOut}" -noout -fingerprint -sha256`,
  { encoding: 'utf8' },
).trim().replace('SHA256 Fingerprint=', '').trim();
console.log(`   Fingerprint: ${fp}`);

// 5. Obter data de expiração
const expiry = execSync(
  `"${OPENSSL}" x509 -in "${crtOut}" -noout -enddate`,
  { encoding: 'utf8' },
).trim().replace('notAfter=', '').trim();
const expiresAt = new Date(expiry).toISOString();

// 6. Registar na API do servidor
console.log('\n4. Registar certificado na CA-CAMPUS (API)…');

const CA      = fs.readFileSync(caCrt);
const CLI_CRT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY = fs.readFileSync(path.join(certsDir, 'client.key'));

// Primeiro fazer login para obter token admin
const loginToken = await new Promise((resolve, reject) => {
  const body = JSON.stringify({ email: 'admin@campus.co.ao', password: 'Campus123' });
  const req = https.request({
    hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST',
    rejectUnauthorized: false, cert: CLI_CRT, key: CLI_KEY, ca: CA,
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, (res) => {
    let raw = ''; res.on('data', (d) => (raw += d));
    res.on('end', () => { try { resolve(JSON.parse(raw).data?.token); } catch { reject(new Error(raw)); } });
  });
  req.on('error', reject); req.write(body); req.end();
});

if (!loginToken) { console.error('   ❌ Não foi possível autenticar na API'); process.exit(1); }

const registered = await new Promise((resolve, reject) => {
  const body = JSON.stringify({ cn, issued_to: destTo, expires_at: expiresAt, fingerprint: fp });
  const req = https.request({
    hostname: 'localhost', port: 3001, path: '/api/admin/certs', method: 'POST',
    rejectUnauthorized: false, cert: CLI_CRT, key: CLI_KEY, ca: CA,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      Authorization: `Bearer ${loginToken}`,
    },
  }, (res) => {
    let raw = ''; res.on('data', (d) => (raw += d));
    res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { reject(new Error(raw)); } });
  });
  req.on('error', reject); req.write(body); req.end();
});

if (registered?.success) {
  console.log(`   ✅ Certificado registado (id: ${registered.data?.cert?.id})`);
} else {
  console.log(`   ⚠️  Servidor respondeu: ${JSON.stringify(registered)}`);
}

console.log('\n══════════════════════════════════════════════');
console.log(' Certificado emitido com sucesso!');
console.log(`   Chave:  server/certs/${safeCn}.key`);
console.log(`   Cert:   server/certs/${safeCn}.crt`);
console.log(' Para usar em curl:');
console.log(`   node server/scripts/test-mtls.mjs  (ou use ${safeCn}.crt)`);
console.log('══════════════════════════════════════════════\n');
