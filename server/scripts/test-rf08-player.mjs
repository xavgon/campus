/**
 * Script de teste — RF08 (Controlos do player multimédia)
 * Valida suporte de seek/retrocesso/avanço no streaming (HTTP Range) e metadados para a barra de progresso.
 * Executa: node server/scripts/test-rf08-player.mjs
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

const publishWav = (token, title, wavBuffer) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF08${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="rf08.wav"\r\n` +
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
  const email = `rf08-${stamp}@campus.test`;
  const password = 'Rf08Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: 'RF08 Player',
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

const parseContentRangeTotal = (contentRange) => {
  const match = String(contentRange ?? '').match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const run = async () => {
  console.log('\n=== RF08 — Controlos do player multimédia ===\n');

  const token = await registerCreator();
  const publishRes = await publishWav(token, `RF08 Player ${stamp}`, createWav(5));
  const podcastId = publishRes.body?.data?.podcast?.id;
  check('Episódio publicado para testes do player', publishRes.status === 201 && !!podcastId);

  if (!podcastId) {
    process.exit(1);
  }

  const podcast = await waitForCompression(token, podcastId);
  check('Áudio comprimido disponível para reprodução', podcast?.audio_url != null);
  check(
    'duration_seconds na API (barra de progresso)',
    (podcast?.duration_seconds ?? 0) >= 1,
    String(podcast?.duration_seconds),
  );

  const fullStream = await streamRequest(podcastId, token);
  const fileSize = Number(fullStream.headers['content-length'] ?? 0);
  check('Stream completo devolve Content-Length', fullStream.status === 200 && fileSize > 0, String(fileSize));
  check(
    'Accept-Ranges: bytes (seek / barra de progresso)',
    fullStream.headers['accept-ranges'] === 'bytes',
    fullStream.headers['accept-ranges'] ?? 'ausente',
  );

  const playStart = await streamRequest(podcastId, token, 'bytes=0-2047');
  check('Play no início (Range bytes=0-2047) → 206', playStart.status === 206);
  check('Segmento inicial recebido', playStart.bodySize === 2048, `${playStart.bodySize} bytes`);

  const midStart = Math.max(0, Math.floor(fileSize / 2) - 512);
  const midEnd = midStart + 1023;
  const seekMid = await streamRequest(podcastId, token, `bytes=${midStart}-${midEnd}`);
  const midTotal = parseContentRangeTotal(seekMid.headers['content-range']);
  check('Seek ao meio (barra de progresso) → 206', seekMid.status === 206);
  check('Content-Range total coincide com ficheiro', midTotal === fileSize, `${midTotal} vs ${fileSize}`);

  const skipForwardStart = Math.min(fileSize - 1024, midStart + 4096);
  const skipForward = await streamRequest(
    podcastId,
    token,
    `bytes=${skipForwardStart}-${skipForwardStart + 1023}`,
  );
  check('Avançar (+segmento) via Range → 206', skipForward.status === 206);

  const rewind = await streamRequest(podcastId, token, 'bytes=0-1023');
  check('Retroceder ao início (stop/rewind) → 206', rewind.status === 206);
  check('Retrocesso recebe bytes do início', rewind.bodySize === 1024, `${rewind.bodySize} bytes`);

  const nearEndStart = Math.max(0, fileSize - 2048);
  const nearEnd = await streamRequest(podcastId, token, `bytes=${nearEndStart}-${fileSize - 1}`);
  check('Seek perto do fim → 206', nearEnd.status === 206);

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF08 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF08:', err.message);
  process.exit(1);
});
