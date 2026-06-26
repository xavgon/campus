/**
 * Script de teste — RF06 (Reprodução / streaming HTTP)
 * Executa: node server/scripts/test-rf06-streaming.mjs
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

const streamRequest = (podcastId, options = {}) =>
  new Promise((resolve, reject) => {
    const { token, useQuery = false, range, invalidId = false } = options;
    const id = invalidId ? '00000000-0000-0000-0000-000000000099' : podcastId;
    let reqPath = `/api/stream/${id}`;
    const headers = {};

    if (useQuery && token) {
      reqPath += `?token=${encodeURIComponent(token)}`;
    } else if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (range) headers.Range = range;

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
        headers,
      },
      (res) => {
        let bodySize = 0;
        res.on('data', (chunk) => {
          bodySize += chunk.length;
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            bodySize,
          });
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

const publishWav = (token, title, wavBuffer) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF06${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="rf06.wav"\r\n` +
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
  const email = `rf06-${stamp}@campus.test`;
  const password = 'Rf06Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: 'RF06 Stream',
    email,
    password,
  });
  let token = registerRes.body?.data?.token;
  const becomeRes = await request('POST', '/api/auth/profile/become-creator', null, authHeader(token));
  token = becomeRes.body?.data?.token ?? token;
  return token;
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
  console.log('\n=== RF06 — Reprodução / streaming ===\n');

  const token = await registerCreator();
  const publishRes = await publishWav(token, `RF06 Stream ${stamp}`, createWav(3));
  const podcastId = publishRes.body?.data?.podcast?.id;
  check('Episódio publicado para streaming', publishRes.status === 201 && !!podcastId);

  if (!podcastId) {
    process.exit(1);
  }

  const podcast = await waitForCompression(token, podcastId);
  check('Áudio comprimido pronto para stream', podcast?.audio_url != null);
  check(
    'duration_seconds disponível na API',
    (podcast?.duration_seconds ?? 0) >= 1,
    String(podcast?.duration_seconds),
  );

  const noAuth = await streamRequest(podcastId, {});
  check('Stream sem token devolve 401', noAuth.status === 401);

  const notFound = await streamRequest(podcastId, { token, invalidId: true });
  check('Stream de episódio inexistente devolve 404', notFound.status === 404);

  const fullStream = await streamRequest(podcastId, { token, useQuery: true });
  check('GET /stream/:id com ?token= devolve 200', fullStream.status === 200);
  check(
    'Resposta inclui Accept-Ranges: bytes',
    fullStream.headers['accept-ranges'] === 'bytes',
    fullStream.headers['accept-ranges'] ?? 'ausente',
  );
  check(
    'Content-Type de áudio',
    String(fullStream.headers['content-type'] ?? '').startsWith('audio/'),
    fullStream.headers['content-type'],
  );
  check('Corpo do stream recebido', fullStream.bodySize > 0, `${fullStream.bodySize} bytes`);

  const headerAuth = await streamRequest(podcastId, { token, useQuery: false });
  check('GET /stream/:id com Authorization Bearer', headerAuth.status === 200);

  const rangeRes = await streamRequest(podcastId, {
    token,
    useQuery: true,
    range: 'bytes=0-1023',
  });
  check('Pedido Range devolve 206 Partial Content', rangeRes.status === 206);
  check(
    'Content-Range presente',
    String(rangeRes.headers['content-range'] ?? '').startsWith('bytes '),
    rangeRes.headers['content-range'],
  );
  check(
    'Segmento Range tem tamanho correcto',
    rangeRes.bodySize === 1024,
    `${rangeRes.bodySize} bytes`,
  );

  const invalidRange = await streamRequest(podcastId, {
    token,
    useQuery: true,
    range: 'bytes=999999999-',
  });
  check('Range inválido devolve 416', invalidRange.status === 416);

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF06 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF06:', err.message);
  process.exit(1);
});
