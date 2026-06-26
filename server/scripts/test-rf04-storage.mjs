/**
 * Script de teste — RF04 (Armazenamento de conteúdos multimédia)
 * Executa: node server/scripts/test-rf04-storage.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

/** WAV mono 8 kHz — ~1 segundo (para ffprobe registar duração). */
const createOneSecondWav = () => {
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

const publishMultipart = (token, fields, audioBuffer) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF04${Date.now()}`;
    const parts = [];

    for (const [name, value] of Object.entries(fields)) {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
          'utf8',
        ),
      );
    }

    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="rf04-1s.wav"\r\nContent-Type: audio/wav\r\n\r\n`,
        'utf8',
      ),
    );
    parts.push(audioBuffer);
    parts.push(Buffer.from('\r\n', 'utf8'));
    parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));

    const body = Buffer.concat(parts);

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
  const email = `rf04-${stamp}@campus.test`;
  const password = 'Rf04Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: 'RF04 Storage',
    email,
    password,
  });
  let token = registerRes.body?.data?.token;
  const becomeRes = await request('POST', '/api/auth/profile/become-creator', null, authHeader(token));
  token = becomeRes.body?.data?.token ?? token;
  return { token, email, userId: registerRes.body?.data?.user?.id };
};

const run = async () => {
  console.log('\n=== RF04 — Armazenamento multimédia ===\n');

  const { token, email, userId } = await registerCreator();
  check('Utilizador criador registado', !!token && !!userId);

  const profileRes = await request('GET', '/api/auth/profile', null, authHeader(token));
  check('Dados de utilizador persistidos (perfil)', profileRes.body?.data?.user?.email === email);

  const categoriesRes = await request('GET', '/api/categories', null, authHeader(token));
  const categories = categoriesRes.body?.data?.categories ?? [];
  check('GET /categories devolve catálogo', categoriesRes.status === 200 && categories.length > 0);
  const categoryId = categories[0]?.id;

  const title = `RF04 Storage ${stamp}`;
  const publishRes = await publishMultipart(
    token,
    {
      title,
      description: 'Teste RF04 — metadados e ficheiros multimédia',
      category_id: String(categoryId),
    },
    createOneSecondWav(),
  );
  const podcast = publishRes.body?.data?.podcast;
  check('Upload persiste episódio na BD', publishRes.status === 201 && !!podcast?.id, publishRes.body?.message ?? `HTTP ${publishRes.status}`);
  if (!podcast?.id) {
    console.log(`\n--- Resultado: ${failures} falha(s) ---\n`);
    process.exit(1);
  }
  check('Metadado original_size', (podcast?.original_size ?? 0) > 0, String(podcast?.original_size));
  check('Metadado duration_seconds (ffprobe)', (podcast?.duration_seconds ?? 0) >= 1, String(podcast?.duration_seconds));
  check('Metadado media_format na origem', podcast?.media_format === 'wav', podcast?.media_format ?? 'null');
  check('Categoria associada', podcast?.category_id === categoryId, String(podcast?.category_id));
  check('Autor associado (user_id)', podcast?.user_id === userId);

  const audioPath = podcast?.audio_url
    ? path.join(projectRoot, podcast.audio_url.replace(/^\//, ''))
    : null;
  check('Ficheiro de áudio no disco', audioPath ? fs.existsSync(audioPath) : false, audioPath ?? '');

  // Aguardar compressão para validar armazenamento comprimido
  let compressed = null;
  for (let i = 0; i < 25; i += 1) {
    await sleep(2000);
    const detailRes = await request('GET', `/api/podcasts/${podcast.id}`, null, authHeader(token));
    compressed = detailRes.body?.data?.podcast;
    if (compressed?.compressed_size != null) break;
  }
  check('compressed_size após FFmpeg', compressed?.compressed_size != null, String(compressed?.compressed_size));
  check(
    'media_format actualizado pós-compressão',
    compressed?.media_format === 'mp3',
    compressed?.media_format ?? 'null',
  );

  const compressedPath = compressed?.audio_url
    ? path.join(projectRoot, compressed.audio_url.replace(/^\//, ''))
    : null;
  check(
    'Ficheiro comprimido no disco',
    compressedPath ? fs.existsSync(compressedPath) : false,
    compressedPath ?? '',
  );

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF04 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF04:', err.message);
  process.exit(1);
});
