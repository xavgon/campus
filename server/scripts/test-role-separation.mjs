/**
 * Script de teste — Task 9 (Separação de Papéis / RBAC)
 * Executa: node server/scripts/test-role-separation.mjs
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

let failures = 0;

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (detail) console.log(`   → ${detail}`);
  if (!ok) failures += 1;
};

const request = (method, reqPath, body = null, extraHeaders = {}) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: reqPath,
        method,
        rejectUnauthorized: false,
        cert: CLI_CERT,
        key: CLI_KEY,
        ca: CA,
        headers: {
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
          ...extraHeaders,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: raw });
          }
        });
      },
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });

const createMinimalWav = () => {
  const dataSize = 400;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
};

const publishPodcast = (token, title) =>
  new Promise((resolve, reject) => {
    const audio = createMinimalWav();
    const boundary = `----CampusRoles${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="task9.wav"\r\n` +
        `Content-Type: audio/wav\r\n\r\n`,
      'utf8',
    );
    const closing = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([preamble, audio, closing]);

    const r = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: '/api/podcasts',
        method: 'POST',
        rejectUnauthorized: false,
        cert: CLI_CERT,
        key: CLI_KEY,
        ca: CA,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: raw });
          }
        });
      },
    );
    r.on('error', reject);
    r.write(body);
    r.end();
  });

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste Separação de Papéis (Task 9)');
console.log('══════════════════════════════════════════════\n');

console.log('Passo 1: autenticar como admin…');
const adminLogin = await request('POST', '/api/auth/login', {
  email: 'admin@campus.co.ao',
  password: 'Campus123',
});
check('Login admin', adminLogin.status === 200);
const adminToken = adminLogin.body?.data?.token;
const adminAuth = { Authorization: `Bearer ${adminToken}` };
check('Papel admin', adminLogin.body?.data?.user?.role === 'admin', adminLogin.body?.data?.user?.role);

console.log('\nPasso 2: admin bloqueado ao publicar…');
const adminPublishUser = await publishPodcast(adminToken, 'Podcast do Admin');
check('POST /api/podcasts → 403', adminPublishUser.status === 403, adminPublishUser.body?.message);

const adminPublishAdmin = await request(
  'POST',
  '/api/admin/podcasts',
  { title: 'Podcast Admin', user_id: 'qualquer' },
  adminAuth,
);
check('POST /api/admin/podcasts → 403', adminPublishAdmin.status === 403, adminPublishAdmin.body?.message);

console.log('\nPasso 3: admin modera (acções permitidas)…');
const adminUsers = await request('GET', '/api/admin/users', null, adminAuth);
check('GET /admin/users', adminUsers.status === 200);

const adminPodcasts = await request('GET', '/api/admin/podcasts', null, adminAuth);
const posts = adminPodcasts.body?.data?.podcasts ?? [];
check('GET /admin/podcasts', adminPodcasts.status === 200, `${posts.length} publicação(ões)`);

if (posts[0]) {
  const patchRes = await request(
    'PATCH',
    `/api/admin/podcasts/${posts[0].id}`,
    { title: posts[0].title },
    adminAuth,
  );
  check('PATCH /admin/podcasts (moderação)', patchRes.status === 200);
}

const adminLogs = await request('GET', '/api/admin/logs', null, adminAuth);
check('GET /admin/logs', adminLogs.status === 200);

console.log('\nPasso 4: utilizador normal não publica…');
const testEmail = `task9-${Date.now()}@campus.co.ao`;
const testPass = 'Campus123!';
const registerRes = await request('POST', '/api/auth/register', {
  nome: 'Conta Task9',
  email: testEmail,
  password: testPass,
});
check('Registo de teste', registerRes.status === 200 || registerRes.status === 201, `HTTP ${registerRes.status}`);

const userLogin = await request('POST', '/api/auth/login', { email: testEmail, password: testPass });
const userToken = userLogin.body?.data?.token;
const userId = userLogin.body?.data?.user?.id;
check('Login como user', userLogin.status === 200 && !!userToken);

const userPublish = await publishPodcast(userToken, 'Tentativa user');
check('User sem creator → 403', userPublish.status === 403, userPublish.body?.message);

console.log('\nPasso 5: admin promove a creator e publica…');
if (userId) {
  const promoteRes = await request(
    'PATCH',
    `/api/admin/users/${userId}`,
    { role: 'creator' },
    adminAuth,
  );
  check('Admin promove a creator', promoteRes.status === 200);
}

const creatorLogin = await request('POST', '/api/auth/login', { email: testEmail, password: testPass });
const creatorToken = creatorLogin.body?.data?.token;
check('Login com JWT de creator', creatorLogin.status === 200 && creatorLogin.body?.data?.user?.role === 'creator');

const creatorPublish = await publishPodcast(creatorToken, `Task9 Creator ${Date.now()}`);
check('Creator publica → 201', creatorPublish.status === 201, `HTTP ${creatorPublish.status}`);

console.log('\n══════════════════════════════════════════════');
console.log(' Separação de papéis (Task 9):');
console.log('   admin   → modera plataforma (users, logs, PATCH podcasts)');
console.log('   creator → publica episódios e transmite live');
console.log('   user    → ouve e descarrega');
console.log('   UI: /admin/users (papéis) + /admin/posts (moderação)');
console.log('══════════════════════════════════════════════\n');

if (failures > 0) {
  console.error(`Falhas: ${failures}`);
  process.exit(1);
}
