/**
 * Script de teste — RF10 (Consulta de conteúdos)
 * Executa: node server/scripts/test-rf10-catalog.mjs
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

const publishPodcast = (token, title) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF10${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="description"\r\n\r\n` +
        `Descrição detalhada RF10 ${stamp}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="rf10.wav"\r\n` +
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

const registerCreator = async () => {
  const email = `rf10-${stamp}@campus.test`;
  const password = 'Rf10Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: `RF10 Autor ${stamp}`,
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
  console.log('\n=== RF10 — Consulta de conteúdos ===\n');

  const token = await registerCreator();
  const firstTitle = `RF10 Alpha ${stamp}`;
  const secondTitle = `RF10 Beta ${stamp}`;

  const firstPublish = await publishPodcast(token, firstTitle);
  const secondPublish = await publishPodcast(token, secondTitle);
  const firstId = firstPublish.body?.data?.podcast?.id;
  const secondId = secondPublish.body?.data?.podcast?.id;

  check('Dois episódios publicados', firstPublish.status === 201 && secondPublish.status === 201);
  if (!firstId || !secondId) process.exit(1);

  await waitForCompression(token, firstId);
  await waitForCompression(token, secondId);

  const listRes = await request('GET', '/api/podcasts?page=1&limit=1', null, authHeader(token));
  const pagination = listRes.body?.data?.pagination;
  check('Listagem autenticada com paginação', listRes.status === 200 && pagination != null);
  check('Página 1 com limit=1 devolve 1 item', listRes.body?.data?.podcasts?.length === 1);
  check('Metadados de paginação presentes', pagination?.totalPages >= 1, JSON.stringify(pagination));

  const page2 = await request('GET', '/api/podcasts?page=2&limit=1', null, authHeader(token));
  check('Página 2 acessível', page2.status === 200 && page2.body?.data?.podcasts?.length === 1);

  const idsPage1 = listRes.body?.data?.podcasts?.map((p) => p.id) ?? [];
  const idsPage2 = page2.body?.data?.podcasts?.map((p) => p.id) ?? [];
  check('Páginas diferentes', idsPage1[0] !== idsPage2[0], `${idsPage1[0]} vs ${idsPage2[0]}`);

  const detail = await request('GET', `/api/podcasts/${firstId}`, null, authHeader(token));
  const podcast = detail.body?.data?.podcast;
  check('Detalhe autenticado por ID', detail.status === 200 && podcast?.id === firstId);
  check('Detalhe inclui título', podcast?.title === firstTitle, podcast?.title);
  check('Detalhe inclui descrição', typeof podcast?.description === 'string');
  check('Detalhe inclui autor', typeof podcast?.author_nome === 'string', podcast?.author_nome);
  check(
    'Detalhe inclui duração',
    (podcast?.duration_seconds ?? 0) >= 0,
    String(podcast?.duration_seconds),
  );

  const publicDetail = await request('GET', `/api/podcasts/public/${firstId}`);
  const publicPodcast = publicDetail.body?.data?.podcast;
  check('Detalhe público por ID', publicDetail.status === 200 && publicPodcast?.id === firstId);
  check('Detalhe público sem audio_url', publicPodcast?.audio_url === undefined);

  const publicList = await request(
    'GET',
    `/api/podcasts/public?search=${encodeURIComponent('RF10 Alpha')}&page=1&limit=12`,
  );
  check(
    'Listagem pública com paginação',
    publicList.status === 200 && publicList.body?.data?.pagination != null,
  );
  check(
    'Episódio RF10 no catálogo público',
    (publicList.body?.data?.podcasts ?? []).some((item) => item.id === firstId),
  );

  const missing = await request('GET', '/api/podcasts/public/00000000-0000-0000-0000-000000000099');
  check('Detalhe público inexistente devolve 404', missing.status === 404);

  const summary = listRes.body?.data?.summary;
  check('Resumo de estados na listagem', summary != null && summary.published >= 1);

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF10 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF10:', err.message);
  process.exit(1);
});
