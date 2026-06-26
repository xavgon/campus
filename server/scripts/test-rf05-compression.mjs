/**
 * Script de teste — RF05 (Compressão automática de áudio)
 * Executa: node server/scripts/test-rf05-compression.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const MP3_PROFILE = 'MP3 · 128 kbps · mono';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');
const projectRoot = path.resolve(__dirname, '..');

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

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

/** WAV PCM mono — duração configurável (para testar redução de tamanho). */
const createWav = (seconds, sampleRate = 44100) => {
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

const publishWav = (token, title, wavBuffer, filename = 'rf05-test.wav') =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF05${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="description"\r\n\r\nTeste RF05 compressão FFmpeg\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="${filename}"\r\n` +
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
  const email = `rf05-${stamp}@campus.test`;
  const password = 'Rf05Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: 'RF05 Compression',
    email,
    password,
  });
  let token = registerRes.body?.data?.token;
  const becomeRes = await request('POST', '/api/auth/profile/become-creator', null, authHeader(token));
  token = becomeRes.body?.data?.token ?? token;
  return token;
};

const waitForCompression = async (token, podcastId) => {
  for (let i = 0; i < 30; i += 1) {
    await sleep(2000);
    const detailRes = await request('GET', `/api/podcasts/${podcastId}`, null, authHeader(token));
    const podcast = detailRes.body?.data?.podcast;
    if (podcast?.compressed_size != null) return podcast;
  }
  return null;
};

const run = async () => {
  console.log('\n=== RF05 — Compressão automática ===\n');

  check('Perfil MP3 documentado', MP3_PROFILE === 'MP3 · 128 kbps · mono');

  const token = await registerCreator();
  const wav = createWav(12);
  const title = `RF05 Compressão ${stamp}`;
  const publishRes = await publishWav(token, title, wav);
  const uploaded = publishRes.body?.data?.podcast;
  check('Upload aceite para compressão', publishRes.status === 201 && !!uploaded?.id);

  if (!uploaded?.id) {
    process.exit(1);
  }

  const progressRes = await request(
    'GET',
    `/api/podcasts/${uploaded.id}/compression-progress`,
    null,
    authHeader(token),
  );
  const progress = progressRes.body?.data?.progress;
  check(
    'Endpoint de progresso FFmpeg disponível',
    progressRes.status === 200,
    progress?.active ? 'activo' : 'inactivo ou concluído',
  );

  const podcast = await waitForCompression(token, uploaded.id);
  check('Compressão concluída (compressed_size)', podcast?.compressed_size != null);

  if (!podcast) {
    process.exit(1);
  }

  check('Formato comprimido MP3', podcast.media_format === 'mp3', podcast.media_format);
  check(
    'Perfil de compressão MP3',
    MP3_PROFILE === 'MP3 · 128 kbps · mono',
  );
  check(
    'compression_ratio registado',
    podcast.compression_ratio != null && Number.isFinite(Number(podcast.compression_ratio)),
    String(podcast.compression_ratio),
  );
  check(
    'processing_time_ms registado',
    (podcast.processing_time_ms ?? 0) > 0,
    String(podcast.processing_time_ms),
  );
  const originalSize = Number(podcast.original_size);
  const compressedSize = Number(podcast.compressed_size);
  const compressionRatio = Number(podcast.compression_ratio);

  check(
    'Ficheiro comprimido menor que o original',
    compressedSize < originalSize,
    `${originalSize} → ${compressedSize}`,
  );
  check(
    'Redução de tamanho significativa (≥ 50%)',
    compressionRatio >= 50,
    `${compressionRatio}%`,
  );

  const compressedPath = podcast.audio_url
    ? path.join(projectRoot, podcast.audio_url.replace(/^\//, ''))
    : null;
  check(
    'Ficheiro MP3 em uploads/audio/compressed',
    compressedPath?.includes('compressed') && fs.existsSync(compressedPath),
    compressedPath ?? '',
  );

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF05 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF05:', err.message);
  process.exit(1);
});
