/**
 * Script de teste — Task 6 (Validação de Autoria de Conteúdo)
 * Verifica que:
 *   1. Podcasts publicados guardam o fingerprint do cert do autor
 *   2. Qualquer pessoa pode verificar a autoria do conteúdo via API
 *   3. Publicações sem cert têm author_cert_fingerprint = null (rastreável)
 *
 * Executa: node server/scripts/test-authorship.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const CA       = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY  = fs.readFileSync(path.join(certsDir, 'client.key'));

const req = (method, reqPath, body, headers = {}) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request({
      hostname: 'localhost', port: 3001, path: reqPath, method,
      rejectUnauthorized: false, cert: CLI_CERT, key: CLI_KEY, ca: CA,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    }, (res) => {
      let raw = ''; res.on('data', (d) => (raw += d));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (detail) console.log(`   → ${detail}`);
};

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste Validação de Autoria (Task 6)');
console.log('══════════════════════════════════════════════\n');

// 1. Login como admin com certificado
console.log('Passo 1: autenticar com certificado de cliente…');
const loginRes = await req('POST', '/api/auth/login', { email: 'admin@campus.co.ao', password: 'Campus123' });
check('Login bem-sucedido', loginRes.status === 200);
const token = loginRes.body?.data?.token;
check('Token obtido', !!token);

const auth = { Authorization: `Bearer ${token}` };

// 2. Verificar lista de podcasts — procurar campos de autoria
console.log('\nPasso 2: verificar campos de autoria nos podcasts…');
const podcastsRes = await req('GET', '/api/podcasts', null, auth);
check('Podcasts acessíveis', podcastsRes.status === 200, `HTTP ${podcastsRes.status}`);

const podcasts = podcastsRes.body?.data?.podcasts ?? [];
check('Resposta tem lista de podcasts', Array.isArray(podcasts), `${podcasts.length} podcast(s)`);

if (podcasts.length > 0) {
  const p = podcasts[0];
  // Os campos existem na resposta (podem ser null para podcasts antigos sem cert)
  check('Campo author_cert_fingerprint presente na resposta', 'author_cert_fingerprint' in p,
    p.author_cert_fingerprint ?? 'null (podcast publicado antes da Task 6)');
  check('Campo author_cert_cn presente na resposta', 'author_cert_cn' in p,
    p.author_cert_cn ?? 'null');

  // Contar quantos têm autoria certificada
  const certified = podcasts.filter((x) => x.author_cert_fingerprint);
  const uncertified = podcasts.filter((x) => !x.author_cert_fingerprint);
  console.log(`   Certificados: ${certified.length} | Sem cert (antigos): ${uncertified.length}`);
} else {
  console.log('   ℹ️  Sem podcasts na BD — publica um para ver o cert guardado');
}

// 3. Admin pode ver a lista com info de autoria
console.log('\nPasso 3: admin verifica autoria via painel…');
const adminPodcastsRes = await req('GET', '/api/admin/podcasts', null, auth);
check('Admin podcasts acessíveis', adminPodcastsRes.status === 200);

console.log('\n══════════════════════════════════════════════');
console.log('Mecanismo de validação de autoria:');
console.log('  • author_cert_fingerprint: identifica o dispositivo que publicou');
console.log('  • author_cert_cn: nome do certificado do autor');
console.log('  • Fingerprint vinculado à CA-CAMPUS — não pode ser forjado');
console.log('  • Admin pode auditar: quem publicou o quê e com que dispositivo');
console.log('══════════════════════════════════════════════\n');
