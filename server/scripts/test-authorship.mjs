/**
 * Script de teste — Task 6 (Validação de Autoria de Conteúdo)
 * Executa: node server/scripts/test-authorship.mjs
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

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (detail) console.log(`   → ${detail}`);
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
  const sampleRate = 8000;
  const numSamples = 200;
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

const publishPodcast = (token, title, audioBuffer) =>
  new Promise((resolve, reject) => {
    const boundary = `----CampusAuthorship${Date.now()}`;
    const preamble = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="description"\r\n\r\nEpisódio de teste Task 6\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="audio"; filename="task6-test.wav"\r\n` +
        `Content-Type: audio/wav\r\n\r\n`,
      'utf8',
    );
    const closing = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([preamble, audioBuffer, closing]);

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

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste Validação de Autoria (Task 6)');
console.log('══════════════════════════════════════════════\n');

const testEmail = `authorship-${Date.now()}@campus.co.ao`;
const testPassword = 'Campus123!';

console.log('Passo 1: registar utilizador e activar papel creator…');
const registerRes = await request('POST', '/api/auth/register', {
  nome: 'Autor Teste Task6',
  email: testEmail,
  password: testPassword,
});
check('Registo bem-sucedido', registerRes.status === 201 || registerRes.status === 200);

let creatorToken = registerRes.body?.data?.token;
if (!creatorToken) {
  const loginRes = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: testPassword,
  });
  creatorToken = loginRes.body?.data?.token;
}

const creatorAuth = { Authorization: `Bearer ${creatorToken}` };
const becomeRes = await request('POST', '/api/auth/profile/become-creator', null, creatorAuth);
check('Conta promovida a creator', becomeRes.status === 200);
creatorToken = becomeRes.body?.data?.token ?? creatorToken;
const publishAuth = { Authorization: `Bearer ${creatorToken}` };

console.log('\nPasso 2: publicar episódio com certificado de dispositivo…');
const publishTitle = `Task6 Autoria ${Date.now()}`;
const publishRes = await publishPodcast(creatorToken, publishTitle, createMinimalWav());
check('Publicação com mTLS', publishRes.status === 201, `HTTP ${publishRes.status}`);

const published = publishRes.body?.data?.podcast;
check('author_cert_fingerprint guardado', !!published?.author_cert_fingerprint);
check('author_cert_cn guardado', published?.author_cert_cn === 'campus-client', published?.author_cert_cn ?? 'null');

console.log('\nPasso 3: verificar autoria via API pública…');
const podcastsRes = await request('GET', '/api/podcasts', null, publishAuth);
const podcasts = podcastsRes.body?.data?.podcasts ?? [];
const found = podcasts.find((p) => p.id === published?.id);
check('Episódio visível na biblioteca', !!found, found?.title ?? 'não encontrado');
check('Fingerprint exposto na listagem', !!found?.author_cert_fingerprint);
check('CN exposto na listagem', found?.author_cert_cn === 'campus-client');

console.log('\nPasso 4: admin audita autoria no painel…');
const adminLogin = await request('POST', '/api/auth/login', {
  email: 'admin@campus.co.ao',
  password: 'Campus123',
});
const adminToken = adminLogin.body?.data?.token;
const adminAuth = { Authorization: `Bearer ${adminToken}` };
const adminPodcastsRes = await request('GET', '/api/admin/podcasts', null, adminAuth);
const adminRows = adminPodcastsRes.body?.data?.podcasts ?? [];
const adminRow = adminRows.find((p) => p.id === published?.id);
check('Admin vê fingerprint de autoria', !!adminRow?.author_cert_fingerprint);
check('Admin vê CN do autor', adminRow?.author_cert_cn === 'campus-client');

const certified = podcasts.filter((x) => x.author_cert_fingerprint);
const uncertified = podcasts.filter((x) => !x.author_cert_fingerprint);
console.log(`   Certificados: ${certified.length} | Sem cert (antigos): ${uncertified.length}`);

console.log('\n══════════════════════════════════════════════');
console.log(' Validação de autoria (Task 6):');
console.log('   • Publicação → author_cert_fingerprint + author_cert_cn');
console.log('   • UI: badge na página do episódio + /podcasts/new');
console.log('   • Admin: coluna Autoria em /admin/posts');
console.log('══════════════════════════════════════════════\n');
