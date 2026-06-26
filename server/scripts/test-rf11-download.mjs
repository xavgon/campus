/**
 * Script de teste — RF11 (Download de episódios)
 * Executa: node server/scripts/test-rf11-download.mjs
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
            resolve({ status: res.statusCode ?? 0, headers: res.headers, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode ?? 0, headers: res.headers, body: raw });
          }
        });
      },
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });

const downloadRequest = (podcastId, token, media = null) =>
  new Promise((resolve, reject) => {
    let reqPath = `/api/podcasts/${podcastId}/download`;
    if (media) reqPath += `?media=${media}`;

    const r = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: reqPath,
        method: 'GET',
        rejectUnauthorized: false,
        cert: CLI_CERT,
        key: CLI_KEY,
        ca: CA,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      },
    );
    r.on('error', reject);
    r.end();
  });

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createWav = () => {
  const sampleRate = 8000;
  const numSamples = sampleRate;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
};

const publishWav = (token, title) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF11${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="rf11.wav"\r\n` +
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

const registerUser = async (suffix) => {
  const email = `rf11-${suffix}-${stamp}@campus.test`;
  const password = 'Rf11Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: `RF11 ${suffix}`,
    email,
    password,
  });
  return registerRes.body?.data?.token;
};

const becomeCreator = async (token) => {
  const res = await request('POST', '/api/auth/profile/become-creator', null, authHeader(token));
  return res.body?.data?.token ?? token;
};

const waitForCompression = async (token, podcastId) => {
  for (let i = 0; i < 25; i += 1) {
    await sleep(2000);
    const detailRes = await request('GET', `/api/podcasts/${podcastId}`, null, authHeader(token));
    const podcast = detailRes.body?.data?.podcast;
    if (podcast?.compressed_size != null) return podcast;
  }
  return null;
};

const run = async () => {
  console.log('\n=== RF11 — Download de episódios ===\n');

  let creatorToken = await registerUser('creator');
  creatorToken = await becomeCreator(creatorToken);

  const title = `RF11 Download ${stamp}`;
  const publishRes = await publishWav(creatorToken, title);
  const podcastId = publishRes.body?.data?.podcast?.id;
  check('Episódio publicado', publishRes.status === 201 && !!podcastId);

  if (!podcastId) process.exit(1);

  const processingDownload = await downloadRequest(podcastId, creatorToken);
  check(
    'Download bloqueado durante processamento (409)',
    processingDownload.status === 409,
    String(processingDownload.status),
  );

  const noAuth = await downloadRequest(podcastId, null);
  check('Download sem autenticação devolve 401', noAuth.status === 401);

  const ready = await waitForCompression(creatorToken, podcastId);
  check('Episódio comprimido pronto para download', ready?.compressed_size != null);

  const download = await downloadRequest(podcastId, creatorToken);
  const contentLength = Number(download.headers['content-length'] ?? 0);
  const disposition = String(download.headers['content-disposition'] ?? '');

  check('GET /podcasts/:id/download devolve 200', download.status === 200);
  check('Content-Disposition attachment', disposition.includes('attachment'));
  check('Content-Length presente', contentLength > 0, String(contentLength));
  check(
    'Corpo do ficheiro recebido',
    download.body.length > 0 && download.body.length === contentLength,
    `${download.body.length} bytes`,
  );
  check(
    'Content-Type de áudio',
    String(download.headers['content-type'] ?? '').startsWith('audio/'),
    download.headers['content-type'],
  );

  const listenerToken = await registerUser('listener');
  const listenerDownload = await downloadRequest(podcastId, listenerToken);
  check(
    'Utilizador autenticado pode descarregar episódio de outro autor',
    listenerDownload.status === 200,
  );

  const missing = await downloadRequest(
    '00000000-0000-0000-0000-000000000099',
    listenerToken,
  );
  check('Download de episódio inexistente devolve 404', missing.status === 404);

  const videoOnly = await downloadRequest(podcastId, listenerToken, 'video');
  check(
    'Download de vídeo inexistente devolve 404',
    videoOnly.status === 404,
    String(videoOnly.status),
  );

  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@campus.co.ao',
    password: 'Campus123',
  });
  const adminToken = adminLogin.body?.data?.token;
  const downloadsRes = adminToken
    ? await request('GET', '/api/admin/downloads', null, authHeader(adminToken))
    : { status: 0, body: {} };
  const downloads = downloadsRes.body?.data?.downloads ?? [];
  check(
    'Download fica registado no histórico (Task 5)',
    downloads.some((row) => row.podcast_id === podcastId),
    `${downloads.length} registo(s)`,
  );

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF11 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF11:', err.message);
  process.exit(1);
});
