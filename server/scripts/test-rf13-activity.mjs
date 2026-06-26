/**
 * Script de teste — RF13 (Registo de atividades)
 * Verifica que acções do sistema são persistidas em logs assinados,
 * consultáveis pelo utilizador (GET /auth/activity) e pelo admin (GET /admin/logs).
 *
 * Executa: node server/scripts/test-rf13-activity.mjs
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const downloadRequest = (podcastId, token) =>
  new Promise((resolve, reject) => {
    const r = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/podcasts/${podcastId}/download`,
        method: 'GET',
        rejectUnauthorized: false,
        cert: CLI_CERT,
        key: CLI_KEY,
        ca: CA,
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0 }));
      },
    );
    r.on('error', reject);
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

const publishWav = (token, title) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF13${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="rf13.wav"\r\n` +
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

const waitForCompression = async (token, podcastId) => {
  for (let i = 0; i < 25; i += 1) {
    await sleep(2000);
    const detailRes = await request('GET', `/api/podcasts/${podcastId}`, null, authHeader(token));
    const podcast = detailRes.body?.data?.podcast;
    if (podcast?.compressed_size != null) return podcast;
  }
  return null;
};

const hasAction = (logs, prefix) => logs.some((l) => String(l.action).includes(prefix));

const isDescending = (logs) => {
  for (let i = 1; i < logs.length; i += 1) {
    const prev = new Date(logs[i - 1].created_at).getTime();
    const curr = new Date(logs[i].created_at).getTime();
    if (prev < curr) return false;
  }
  return true;
};

const run = async () => {
  console.log('\n=== RF13 — Registo de atividades ===\n');

  const email = `rf13-${stamp}@campus.test`;
  const password = 'Rf13Pass123!';
  const nome = 'RF13 Activity Tester';

  const registerRes = await request('POST', '/api/auth/register', { nome, email, password });
  const userId = registerRes.body?.data?.user?.id;
  let token = registerRes.body?.data?.token;
  check('Registo cria conta de teste', registerRes.status === 201 && !!token && !!userId);

  const loginRes = await request('POST', '/api/auth/login', { email, password });
  token = loginRes.body?.data?.token ?? token;
  check('Login reforça sessão', loginRes.status === 200 && !!token);

  const becomeRes = await request('POST', '/api/auth/profile/become-creator', null, authHeader(token));
  token = becomeRes.body?.data?.token ?? token;
  check('Utilizador torna-se criador', becomeRes.status === 200);

  const profileRes = await request(
    'PUT',
    '/api/auth/profile',
    { nome: 'RF13 Actualizado' },
    authHeader(token),
  );
  check('Perfil actualizado', profileRes.status === 200);

  const title = `RF13 Log ${stamp}`;
  const updatedTitle = `RF13 Log Editado ${stamp}`;
  const publishRes = await publishWav(token, title);
  const podcastId = publishRes.body?.data?.podcast?.id;
  check('Episódio publicado', publishRes.status === 201 && !!podcastId);

  if (podcastId) {
    const patchRes = await request(
      'PATCH',
      `/api/podcasts/${podcastId}`,
      { title: updatedTitle },
      authHeader(token),
    );
    check('Episódio actualizado', patchRes.status === 200);

    const ready = await waitForCompression(token, podcastId);
    check('Compressão concluída para download', ready?.compressed_size != null);

    if (ready) {
      const dlRes = await downloadRequest(podcastId, token);
      check('Download registado (200)', dlRes.status === 200);
    }

    const deleteRes = await request('DELETE', `/api/podcasts/${podcastId}`, null, authHeader(token));
    check('Episódio eliminado', deleteRes.status === 200);
  }

  const activityRes = await request('GET', '/api/auth/activity', null, authHeader(token));
  const userLogs = activityRes.body?.data?.logs ?? [];
  check('GET /auth/activity devolve 200', activityRes.status === 200);
  check('Lista de actividade não vazia', userLogs.length > 0, String(userLogs.length));

  check('Log de registo presente', hasAction(userLogs, 'Registo:'));
  check('Log de login presente', hasAction(userLogs, 'Login:'));
  check('Log de criador activado presente', hasAction(userLogs, 'Conta de criador activada'));
  check('Log de perfil actualizado presente', hasAction(userLogs, 'Perfil actualizado'));
  check('Log de publicação presente', hasAction(userLogs, 'Publicou:'));
  check('Log de actualização de podcast presente', hasAction(userLogs, 'Podcast actualizado:'));
  check('Log de download presente', hasAction(userLogs, 'Download:'));
  check('Log de eliminação de podcast presente', hasAction(userLogs, 'Podcast eliminado:'));

  const validShape = userLogs.every(
    (row) =>
      typeof row.id === 'number' &&
      typeof row.action === 'string' &&
      typeof row.created_at === 'string',
  );
  check('Entradas têm id, action e created_at', validShape);
  check('Actividade ordenada por data (mais recente primeiro)', isDescending(userLogs));

  const noAuth = await request('GET', '/api/auth/activity');
  check('GET /auth/activity sem token devolve 401', noAuth.status === 401);

  const adminDenied = await request('GET', '/api/admin/logs', null, authHeader(token));
  check('Utilizador bloqueado em /admin/logs (403)', adminDenied.status === 403);

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@campus.co.ao',
    password: 'Campus123',
  });
  const adminToken = adminLogin.body?.data?.token;
  check('Admin autentica', adminLogin.status === 200 && !!adminToken);

  const adminLogsRes = await request('GET', '/api/admin/logs', null, authHeader(adminToken));
  const adminLogs = adminLogsRes.body?.data?.logs ?? [];
  check('GET /admin/logs devolve 200', adminLogsRes.status === 200);
  check('Admin vê registos globais', adminLogs.length > 0, String(adminLogs.length));

  const userRows = adminLogs.filter((row) => row.user_id === userId);
  check('Admin vê acções do utilizador de teste', userRows.length > 0, String(userRows.length));

  const signedRows = userRows.filter((row) => row.signature);
  check('Logs incluem assinatura digital', signedRows.length > 0);

  const validSignatures = signedRows.every((row) => row.signature_valid === true);
  check('Assinaturas verificadas como válidas', validSignatures);

  const withCert = userRows.some((row) => row.cert_fingerprint || row.cert_cn);
  check('Logs com certificado de cliente (mTLS)', withCert);

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF13 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF13:', err.message);
  process.exit(1);
});
