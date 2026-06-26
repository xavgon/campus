/**
 * Script de teste — RF12 (Gestão de permissões)
 * Executa: node server/scripts/test-rf12-permissions.mjs
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

const stamp = Date.now();
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

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createWav = () => {
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
    const boundary = `----CampusRF12${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="rf12.wav"\r\n` +
        `Content-Type: audio/wav\r\n\r\n`,
      'utf8',
    );
    const closing = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([preamble, createWav(), closing]);

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

const registerUser = async (label) => {
  const email = `rf12-${label}-${stamp}@campus.test`;
  const password = 'Rf12Pass123!';
  const res = await request('POST', '/api/auth/register', {
    nome: `RF12 ${label}`,
    email,
    password,
  });
  return {
    token: res.body?.data?.token,
    role: res.body?.data?.user?.role,
    id: res.body?.data?.user?.id,
    email,
    password,
  };
};

const run = async () => {
  console.log('\n=== RF12 — Gestão de permissões ===\n');

  const listener = await registerUser('listener');
  check('Registo atribui papel user', listener.role === 'user', listener.role);

  const library = await request('GET', '/api/podcasts', null, authHeader(listener.token));
  check('Utilizador acede à biblioteca (GET /podcasts)', library.status === 200);

  const adminDenied = await request('GET', '/api/admin/users', null, authHeader(listener.token));
  check('Utilizador bloqueado no admin (403)', adminDenied.status === 403);

  const publishDenied = await publishPodcast(listener.token, `RF12 bloqueado ${stamp}`);
  check('Utilizador não publica podcasts (403)', publishDenied.status === 403);

  const liveDenied = await request(
    'GET',
    '/api/live/scheduled',
    null,
    authHeader(listener.token),
  );
  check('Utilizador não acede a live agendada de criador (403)', liveDenied.status === 403);

  const becomeRes = await request(
    'POST',
    '/api/auth/profile/become-creator',
    null,
    authHeader(listener.token),
  );
  const creatorToken = becomeRes.body?.data?.token;
  const creatorRole = becomeRes.body?.data?.user?.role;
  check('Utilizador pode tornar-se criador', becomeRes.status === 200 && creatorRole === 'creator');

  const creatorPublish = await publishPodcast(creatorToken, `RF12 Creator ${stamp}`);
  const podcastId = creatorPublish.body?.data?.podcast?.id;
  check('Criador publica episódio (201)', creatorPublish.status === 201 && !!podcastId);

  const creatorLive = await request('GET', '/api/live/scheduled', null, authHeader(creatorToken));
  check('Criador acede a transmissões agendadas', creatorLive.status === 200);

  const creatorAdminDenied = await request(
    'GET',
    '/api/admin/users',
    null,
    authHeader(creatorToken),
  );
  check('Criador bloqueado no admin (403)', creatorAdminDenied.status === 403);

  const other = await registerUser('other');
  if (podcastId) {
    const foreignPatch = await request(
      'PATCH',
      `/api/podcasts/${podcastId}`,
      { title: 'Tentativa não autorizada' },
      authHeader(other.token),
    );
    check('Utilizador não edita episódio alheio (403)', foreignPatch.status === 403);
  }

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@campus.co.ao',
    password: 'Campus123',
  });
  const adminToken = adminLogin.body?.data?.token;
  const adminRole = adminLogin.body?.data?.user?.role;
  check('Admin autentica com papel admin', adminLogin.status === 200 && adminRole === 'admin');

  const adminUsers = await request('GET', '/api/admin/users', null, authHeader(adminToken));
  check('Admin acede a gestão de utilizadores', adminUsers.status === 200);

  const adminPublishDenied = await publishPodcast(adminToken, `RF12 Admin ${stamp}`);
  check('Admin não publica podcasts (403)', adminPublishDenied.status === 403);

  const adminBecome = await request(
    'POST',
    '/api/auth/profile/become-creator',
    null,
    authHeader(adminToken),
  );
  check('Admin não usa become-creator (400)', adminBecome.status === 400);

  if (podcastId) {
    const adminCreatorPatch = await request(
      'PATCH',
      `/api/podcasts/${podcastId}`,
      { title: `RF12 bloqueado admin ${stamp}` },
      authHeader(adminToken),
    );
    check('Admin não edita via rota de criador (403)', adminCreatorPatch.status === 403);

    const adminPatch = await request(
      'PATCH',
      `/api/admin/podcasts/${podcastId}`,
      { title: `RF12 moderação ${stamp}` },
      authHeader(adminToken),
    );
    check('Admin modera episódio no painel (PATCH /admin/podcasts)', adminPatch.status === 200);
  }

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF12 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF12:', err.message);
  process.exit(1);
});
