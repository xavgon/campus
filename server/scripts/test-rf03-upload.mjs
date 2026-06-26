/**
 * Script de teste — RF03 (Upload de podcasts educativos)
 * Executa: node server/scripts/test-rf03-upload.mjs
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

const createMinimalWav = () => {
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

const publishMultipart = (token, fields, audioBuffer = null) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusRF03${Date.now()}`;
    const parts = [];

    for (const [name, value] of Object.entries(fields)) {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
          'utf8',
        ),
      );
    }

    if (audioBuffer) {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="rf03-test.wav"\r\nContent-Type: audio/wav\r\n\r\n`,
          'utf8',
        ),
      );
      parts.push(audioBuffer);
      parts.push(Buffer.from('\r\n', 'utf8'));
    }

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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const registerCreator = async (label) => {
  const email = `rf03-${label}-${stamp}@campus.test`;
  const password = 'Rf03Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: `RF03 ${label}`,
    email,
    password,
  });
  let token = registerRes.body?.data?.token;
  const becomeRes = await request('POST', '/api/auth/profile/become-creator', null, authHeader(token));
  token = becomeRes.body?.data?.token ?? token;
  return { token, email, password };
};

const run = async () => {
  console.log('\n=== RF03 — Upload de podcasts educativos ===\n');

  // Utilizador comum não pode publicar
  const plainRegister = await request('POST', '/api/auth/register', {
    nome: 'RF03 User',
    email: `rf03-user-${stamp}@campus.test`,
    password: 'Rf03Pass123!',
  });
  const userToken = plainRegister.body?.data?.token;
  const denied = await publishMultipart(
    userToken,
    { title: 'Tentativa user', description: 'RF03' },
    createMinimalWav(),
  );
  check('Utilizador comum não publica (403)', denied.status === 403);

  // Admin também não publica (Task 9)
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@campus.co.ao',
    password: 'Campus123',
  });
  const adminToken = adminLogin.body?.data?.token;
  const adminDenied = await publishMultipart(
    adminToken,
    { title: 'Tentativa admin', description: 'RF03' },
    createMinimalWav(),
  );
  check('Admin não publica podcasts (403)', adminDenied.status === 403);

  // Criador publica com sucesso
  const { token: creatorToken } = await registerCreator('creator');
  const title = `RF03 Episódio ${stamp}`;
  const publishRes = await publishMultipart(
    creatorToken,
    { title, description: 'Episódio de teste RF03 — upload multipart' },
    createMinimalWav(),
  );
  const podcast = publishRes.body?.data?.podcast;
  check('Criador publica episódio (201)', publishRes.status === 201);
  check('Resposta inclui id e título', !!podcast?.id && podcast?.title === title);
  check('Áudio armazenado (audio_url)', !!podcast?.audio_url, podcast?.audio_url ?? 'null');
  check('Tamanho original registado', (podcast?.original_size ?? 0) > 0, String(podcast?.original_size));

  // Validação — sem áudio
  const noAudio = await publishMultipart(creatorToken, { title: 'Sem áudio RF03' });
  check('Upload sem áudio/vídeo devolve 400', noAudio.status === 400);

  // Validação — sem título
  const noTitle = await publishMultipart(creatorToken, {}, createMinimalWav());
  check('Upload sem título devolve 400', noTitle.status === 400);

  // Detalhe do episódio
  const detailRes = await request('GET', `/api/podcasts/${podcast.id}`, null, authHeader(creatorToken));
  const detail = detailRes.body?.data?.podcast;
  check('GET /podcasts/:id devolve o episódio', detailRes.status === 200 && detail?.id === podcast.id);

  // Listagem inclui o episódio
  const listRes = await request('GET', '/api/podcasts', null, authHeader(creatorToken));
  const list = listRes.body?.data?.podcasts ?? [];
  const found = list.some((p) => p.id === podcast.id);
  check('Episódio visível na biblioteca', found);

  // Sem autenticação
  const noAuth = await publishMultipart(
    null,
    { title: 'Anónimo' },
    createMinimalWav(),
  );
  check('Upload sem token devolve 401', noAuth.status === 401);

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF03 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF03:', err.message);
  process.exit(1);
});
