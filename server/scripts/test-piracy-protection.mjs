/**
 * Script de teste — Task 5 (Protecção contra Pirataria)
 * Executa: node server/scripts/test-piracy-protection.mjs
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

const downloadPodcast = (podcastId, token) =>
  new Promise((resolve, reject) => {
    const r = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: `/api/podcasts/${podcastId}/download`,
        method: 'GET',
        rejectUnauthorized: false,
        cert: CLI_CERT,
        key: CLI_KEY,
        ca: CA,
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode ?? 0));
      },
    );
    r.on('error', reject);
    r.end();
  });

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste Protecção contra Pirataria (Task 5)');
console.log('══════════════════════════════════════════════\n');

console.log('Passo 1: autenticar como admin…');
const loginRes = await request('POST', '/api/auth/login', {
  email: 'admin@campus.co.ao',
  password: 'Campus123',
});
check('Login bem-sucedido', loginRes.status === 200);
const token = loginRes.body?.data?.token;
check('Token obtido', !!token);
const auth = { Authorization: `Bearer ${token}` };

console.log('\nPasso 2: histórico de downloads (antes)…');
const dlBefore = await request('GET', '/api/admin/downloads', null, auth);
const countBefore = dlBefore.body?.data?.downloads?.length ?? 0;
check('GET /admin/downloads', dlBefore.status === 200, `${countBefore} registo(s)`);

console.log('\nPasso 3: executar download rastreado…');
const podcastsRes = await request('GET', '/api/podcasts', null, auth);
const podcasts = podcastsRes.body?.data?.podcasts ?? [];
const withAudio = podcasts.find((p) => p.audio_url);
let downloadOk = false;

if (withAudio) {
  const code1 = await downloadPodcast(withAudio.id, token);
  const code2 = await downloadPodcast(withAudio.id, token);
  downloadOk = code1 === 200 && code2 === 200;
  check('Dois downloads do episódio', downloadOk, `"${withAudio.title}" — HTTP ${code1}, ${code2}`);
} else {
  console.log('ℹ️  Nenhum episódio com áudio — passo 3 ignorado (publica um podcast com ficheiro).');
}

console.log('\nPasso 4: confirmar registo com fingerprint…');
const dlAfter = await request('GET', '/api/admin/downloads', null, auth);
const downloads = dlAfter.body?.data?.downloads ?? [];
check('Downloads após teste', dlAfter.status === 200, `${downloads.length} registo(s)`);

if (withAudio && downloadOk) {
  const tracked = downloads.filter((d) => d.podcast_id === withAudio.id);
  check('Downloads do episódio registados', tracked.length >= 2, `${tracked.length} entrada(s)`);
  const withCert = tracked.filter((d) => d.cert_fingerprint);
  check('Fingerprint do dispositivo guardado', withCert.length > 0, withCert[0]?.cert_cn ?? 'null');
  check('CN do certificado guardado', withCert.some((d) => d.cert_cn), withCert[0]?.cert_cn ?? 'null');
}

console.log('\nPasso 5: análise de pirataria…');
const piracyRes = await request('GET', '/api/admin/piracy-alerts', null, auth);
const alerts = piracyRes.body?.data?.alerts ?? [];
check('GET /admin/piracy-alerts', piracyRes.status === 200, `${alerts.length} alerta(s)`);

if (withAudio && downloadOk) {
  const alert = alerts.find((a) => a.podcast_id === withAudio.id);
  check('Alerta gerado para episódio com 2+ downloads', !!alert, alert?.podcast_title ?? 'n/a');
  if (alert) {
    check('Métricas do alerta', alert.total_downloads >= 2, `total: ${alert.total_downloads}, certs: ${alert.unique_certs}`);
  }
}

console.log('\nPasso 6: ligação com revogação de cert (Task 4)…');
const certsRes = await request('GET', '/api/admin/certs', null, auth);
const activeCerts = (certsRes.body?.data?.certs ?? []).filter((c) => !c.revoked);
check('Certs activos na CA', activeCerts.length > 0, `${activeCerts.length} cert(s)`);

console.log('\n══════════════════════════════════════════════');
console.log(' Mecanismo anti-pirataria (Task 5):');
console.log('   • Download → podcast_downloads + log assinado');
console.log('   • Admin UI: /admin/piracy');
console.log('   • Revogar cert bloqueia novos acessos (Task 4)');
console.log('══════════════════════════════════════════════\n');
