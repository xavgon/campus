/**
 * Script de teste — RF09 (Pesquisa de podcasts)
 * Executa: node server/scripts/test-rf09-search.mjs
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

const uniqueTitle = `RF09 Episódio ${stamp}`;
const uniqueAuthor = `RF09 Autor ${stamp}`;
const uniqueTheme = `tema educativo fotossíntese ${stamp}`;

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

const publishPodcast = (token, { title, description, categoryId }) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF09${Date.now()}`;
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\n${title}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\n${description}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="category_id"\r\n\r\n${categoryId}\r\n`,
      `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="rf09.wav"\r\nContent-Type: audio/wav\r\n\r\n`,
    ];
    const preamble = Buffer.from(parts.join(''), 'utf8');
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
  const email = `rf09-${stamp}@campus.test`;
  const password = 'Rf09Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: uniqueAuthor,
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

const findInList = (list, podcastId) => list.find((item) => item.id === podcastId);

const run = async () => {
  console.log('\n=== RF09 — Pesquisa de podcasts ===\n');

  const publicList = await request('GET', '/api/podcasts/public');
  check('GET /podcasts/public sem autenticação', publicList.status === 200);

  const publicCategories = await request('GET', '/api/categories/public');
  check('GET /categories/public sem autenticação', publicCategories.status === 200);
  const ciencias = publicCategories.body?.data?.categories?.find((c) => c.name === 'Ciências');
  check('Categoria «Ciências» disponível', !!ciencias?.id, ciencias ? String(ciencias.id) : 'ausente');

  const token = await registerCreator();
  const publishRes = await publishPodcast(token, {
    title: uniqueTitle,
    description: `Episódio com ${uniqueTheme} para testes de pesquisa.`,
    categoryId: ciencias?.id ?? 1,
  });
  const podcastId = publishRes.body?.data?.podcast?.id;
  check('Episódio publicado para pesquisa', publishRes.status === 201 && !!podcastId);

  if (!podcastId) {
    process.exit(1);
  }

  const ready = await waitForCompression(token, podcastId);
  check('Episódio visível no catálogo público (comprimido)', ready?.compressed_size != null);

  const byTitle = await request('GET', `/api/podcasts/public?search=${encodeURIComponent(uniqueTitle)}`);
  check('Pesquisa por título', findInList(byTitle.body?.data?.podcasts ?? [], podcastId) != null);

  const byAuthor = await request(
    'GET',
    `/api/podcasts/public?search=${encodeURIComponent('RF09 Autor')}`,
  );
  check('Pesquisa por autor', findInList(byAuthor.body?.data?.podcasts ?? [], podcastId) != null);

  const byCategory = await request(
    'GET',
    `/api/podcasts/public?search=${encodeURIComponent('Ciências')}`,
  );
  check('Pesquisa por categoria', findInList(byCategory.body?.data?.podcasts ?? [], podcastId) != null);

  const byTheme = await request(
    'GET',
    `/api/podcasts/public?search=${encodeURIComponent('fotossíntese')}`,
  );
  check('Pesquisa por tema educativo (descrição)', findInList(byTheme.body?.data?.podcasts ?? [], podcastId) != null);

  const byCategoryFilter = await request(
    'GET',
    `/api/podcasts/public?category_id=${ciencias?.id ?? 1}`,
  );
  check(
    'Filtro por category_id',
    findInList(byCategoryFilter.body?.data?.podcasts ?? [], podcastId) != null,
  );

  const sample = (byTitle.body?.data?.podcasts ?? [])[0];
  check(
    'Resposta pública sem audio_url',
    sample != null && sample.audio_url === undefined,
    sample?.audio_url ?? 'ok',
  );
  check(
    'Resposta pública sem certificado do autor',
    sample != null && sample.author_cert_fingerprint === undefined,
    sample?.author_cert_fingerprint ?? 'ok',
  );

  const authSearch = await request(
    'GET',
    `/api/podcasts?search=${encodeURIComponent(uniqueTitle)}`,
    null,
    authHeader(token),
  );
  check(
    'Pesquisa autenticada por título',
    findInList(authSearch.body?.data?.podcasts ?? [], podcastId) != null,
  );

  const authCategorySearch = await request('GET', '/api/podcasts?search=Tecnologia', null, authHeader(token));
  check('Pesquisa autenticada inclui nome de categoria', authCategorySearch.status === 200);

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF09 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF09:', err.message);
  process.exit(1);
});
