/**
 * Script de teste — RF07 (VOD — vídeo/áudio sob demanda)
 * Executa: node server/scripts/test-rf07-vod.mjs
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

const streamRequest = (podcastId, token, range = null) =>
  new Promise((resolve, reject) => {
    const headers = { Authorization: `Bearer ${token}` };
    if (range) headers.Range = range;
    const r = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/stream/${podcastId}?token=${encodeURIComponent(token)}`,
        method: 'GET',
        rejectUnauthorized: false,
        cert: CLI_CERT,
        key: CLI_KEY,
        ca: CA,
        headers,
      },
      (res) => {
        let bodySize = 0;
        res.on('data', (chunk) => {
          bodySize += chunk.length;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, headers: res.headers, bodySize });
        });
      },
    );
    r.on('error', reject);
    r.end();
  });

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const createWav = (seconds, sampleRate = 8000) => {
  const numSamples = sampleRate * seconds;
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

const publishWav = (token, title, description, wavBuffer) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF07${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="description"\r\n\r\n${description}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="rf07-vod.wav"\r\n` +
        `Content-Type: audio/wav\r\n\r\n`,
      'utf8',
    );
    const closing = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([preamble, wavBuffer, closing]);

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

const registerCreator = async () => {
  const email = `rf07-${stamp}@campus.test`;
  const password = 'Rf07Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: 'RF07 VOD',
    email,
    password,
  });
  let token = registerRes.body?.data?.token;
  const becomeRes = await request('POST', '/api/auth/profile/become-creator', null, authHeader(token));
  token = becomeRes.body?.data?.token ?? token;
  return token;
};

const waitForVodReady = async (token, podcastId) => {
  for (let i = 0; i < 25; i += 1) {
    await sleep(2000);
    const detailRes = await request('GET', `/api/podcasts/${podcastId}`, null, authHeader(token));
    const podcast = detailRes.body?.data?.podcast;
    if (podcast?.compressed_size != null && podcast?.audio_url) return podcast;
  }
  return null;
};

const run = async () => {
  console.log('\n=== RF07 — VOD (sob demanda) ===\n');

  const token = await registerCreator();
  const title = `RF07 VOD ${stamp}`;
  const publishRes = await publishWav(
    token,
    title,
    'Episódio VOD — disponível na biblioteca após publicação (simula pós-live).',
    createWav(4),
  );
  const podcastId = publishRes.body?.data?.podcast?.id;
  check('Episódio publicado na biblioteca', publishRes.status === 201 && !!podcastId);

  if (!podcastId) process.exit(1);

  const podcast = await waitForVodReady(token, podcastId);
  check('Episódio VOD pronto (comprimido + áudio)', !!podcast?.compressed_size);

  const detail1 = await request('GET', `/api/podcasts/${podcastId}`, null, authHeader(token));
  check('Acesso VOD #1 — metadados sob demanda', detail1.status === 200);

  await sleep(500);
  const detail2 = await request('GET', `/api/podcasts/${podcastId}`, null, authHeader(token));
  check('Acesso VOD #2 — metadados repetidos', detail2.status === 200);

  const stream1 = await streamRequest(podcastId, token);
  check('Reprodução VOD #1 — stream completo', stream1.status === 200 && stream1.bodySize > 0);

  const stream2 = await streamRequest(podcastId, token, 'bytes=0-2047');
  check('Reprodução VOD #2 — seek via Range', stream2.status === 206 && stream2.bodySize === 2048);

  const listRes = await request('GET', '/api/podcasts', null, authHeader(token));
  const inLibrary = (listRes.body?.data?.podcasts ?? []).some((p) => p.id === podcastId);
  check('Episódio permanece no catálogo VOD', inLibrary);

  const recordingsRes = await request('GET', '/api/live/recordings', null, authHeader(token));
  check(
    'API de gravações live (VOD servidor)',
    recordingsRes.status === 200 && Array.isArray(recordingsRes.body?.data?.recordings),
  );

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF07 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF07:', err.message);
  process.exit(1);
});
