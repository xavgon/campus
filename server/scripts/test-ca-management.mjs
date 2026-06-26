/**
 * Teste Gestão de CA — Task 4
 * Executa: node server/scripts/test-ca-management.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const CA = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY = fs.readFileSync(path.join(certsDir, 'client.key'));

const ADMIN_EMAIL = 'admin@campus.co.ao';
const ADMIN_PASS = 'Campus123';

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (detail) console.log(`   → ${detail}`);
};

const request = (options, body = null) =>
  new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const { headers: extraHeaders, ...rest } = options;
    const req = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        rejectUnauthorized: false,
        cert: CLI_CERT,
        key: CLI_KEY,
        ca: CA,
        ...rest,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...extraHeaders,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (d) => (raw += d));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            /**/
          }
          resolve({ status: res.statusCode ?? 0, json, raw });
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste Gestão de CA (Task 4)');
console.log('══════════════════════════════════════════════\n');

console.log('Passo 1: autenticar como admin…');
const login = await request(
  { path: '/api/auth/login', method: 'POST' },
  { email: ADMIN_EMAIL, password: ADMIN_PASS },
);
const token = login.json?.data?.token;
check('Login admin', login.status === 200 && !!token, `HTTP ${login.status}`);

const authHeaders = { Authorization: `Bearer ${token}` };

console.log('\nPasso 2: listar certificados emitidos…');
const listBefore = await request({ path: '/api/admin/certs', method: 'GET', headers: authHeaders });
const certsBefore = listBefore.json?.data?.certs ?? [];
check('GET /admin/certs', listBefore.status === 200, `${certsBefore.length} certificado(s)`);

console.log('\nPasso 3: registar certificado de teste na CA…');
const testCn = `test-ca-${Date.now()}`;
const testFp = `TEST:${Date.now()}:CA:DEMO`;
const register = await request(
  { path: '/api/admin/certs', method: 'POST', headers: authHeaders },
  {
    cn: testCn,
    issued_to: 'demo@campus.co.ao',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    fingerprint: testFp,
  },
);
const registered = register.json?.data?.cert;
check('POST /admin/certs', register.status === 201 && !!registered?.id, `id: ${registered?.id ?? 'n/a'}`);

console.log('\nPasso 4: revogar certificado de teste…');
const revoke = await request(
  {
    path: `/api/admin/certs/${registered?.id}/revoke`,
    method: 'DELETE',
    headers: authHeaders,
  },
  { reason: 'Teste automatizado Task 4' },
);
const revoked = revoke.json?.data?.cert;
check('DELETE /admin/certs/:id/revoke', revoke.status === 200, `revoked: ${revoked?.revoked === true}`);

console.log('\nPasso 5: confirmar estado na listagem…');
const listAfter = await request({ path: '/api/admin/certs', method: 'GET', headers: authHeaders });
const found = (listAfter.json?.data?.certs ?? []).find((c) => c.id === registered?.id);
check('Cert revogado visível na lista', found?.revoked === true, found?.revoked_reason ?? '');

console.log('\nPasso 6: registar campus-client se em falta…');
let campusFp = null;
try {
  const openssl =
    process.platform === 'win32'
      ? 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe'
      : 'openssl';
  const out = execSync(
    `"${openssl}" x509 -in "${path.join(certsDir, 'client.crt')}" -noout -fingerprint -sha256`,
    { encoding: 'utf8' },
  );
  campusFp = out
    .trim()
    .replace(/^sha256\s+fingerprint=/i, '')
    .replace(/^SHA256 Fingerprint=/, '')
    .trim();
} catch {
  console.log('ℹ️  openssl indisponível — passo 6 ignorado.');
}

if (campusFp) {
  const allCerts = listAfter.json?.data?.certs ?? [];
  const hasCampus = allCerts.some((c) => c.fingerprint === campusFp && !c.revoked);
  if (!hasCampus) {
    const regCampus = await request(
      { path: '/api/admin/certs', method: 'POST', headers: authHeaders },
      { cn: 'campus-client', issued_to: 'dev@campus.co.ao', fingerprint: campusFp },
    );
    check('campus-client registado na CA', regCampus.status === 201, `${campusFp.slice(0, 40)}…`);
  } else {
    check('campus-client já registado na CA', true, `${campusFp.slice(0, 40)}…`);
  }
}

console.log('\n══════════════════════════════════════════════');
console.log(' Emissão manual: node server/scripts/issue-client-cert.mjs <cn> <email>');
console.log(' UI admin:        /admin/certs');
console.log('══════════════════════════════════════════════\n');
