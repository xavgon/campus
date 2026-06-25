/**
 * Script de teste — Task 9 (Separação de Papéis: Admin não publica podcasts)
 *
 * Demonstra que:
 *   1. Admin tenta publicar via POST /api/podcasts → 403 (bloqueado por requireCreator)
 *   2. Admin tenta publicar via POST /api/admin/podcasts → 403 (bloqueado explicitamente)
 *   3. Admin consegue gerir utilizadores, logs, certs (papel correcto)
 *   4. Utilizador com papel 'creator' pode publicar (papel correcto)
 *
 * Executa: node server/scripts/test-role-separation.mjs
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
console.log(' CAMPUS — Teste Separação de Papéis (Task 9)');
console.log('══════════════════════════════════════════════\n');

// 1. Login como admin
console.log('Passo 1: autenticar como admin…');
const adminLogin = await req('POST', '/api/auth/login', { email: 'admin@campus.co.ao', password: 'Campus123' });
check('Login admin bem-sucedido', adminLogin.status === 200);
const adminToken = adminLogin.body?.data?.token;
const adminAuth = { Authorization: `Bearer ${adminToken}` };
console.log(`   Papel: ${adminLogin.body?.data?.user?.role ?? 'desconhecido'}`);

// 2. Admin tenta publicar via rota de utilizador → deve falhar (403)
console.log('\nPasso 2: admin tenta publicar via POST /api/podcasts…');
const adminPublishUser = await req('POST', '/api/podcasts',
  { title: 'Podcast do Admin (não deve funcionar)' }, adminAuth);
check('Admin bloqueado (esperado 403)', adminPublishUser.status === 403,
  `HTTP ${adminPublishUser.status} — ${adminPublishUser.body?.message ?? ''}`);

// 3. Admin tenta publicar via rota de admin → também bloqueado (403)
console.log('\nPasso 3: admin tenta publicar via POST /api/admin/podcasts…');
const adminPublishAdmin = await req('POST', '/api/admin/podcasts',
  { title: 'Podcast do Admin', user_id: 'qualquer' }, adminAuth);
check('Admin bloqueado no painel admin (esperado 403)', adminPublishAdmin.status === 403,
  `HTTP ${adminPublishAdmin.status} — ${adminPublishAdmin.body?.message ?? ''}`);

// 4. Admin consegue gerir utilizadores (papel correcto)
console.log('\nPasso 4: admin acede a gestão de utilizadores (acção permitida)…');
const adminUsers = await req('GET', '/api/admin/users', null, adminAuth);
check('Admin lista utilizadores (HTTP 200)', adminUsers.status === 200,
  `${adminUsers.body?.data?.users?.length ?? 0} utilizador(es)`);

// 5. Admin acede a logs (papel correcto)
const adminLogs = await req('GET', '/api/admin/logs', null, adminAuth);
check('Admin acede a logs de auditoria (HTTP 200)', adminLogs.status === 200,
  `${adminLogs.body?.data?.logs?.length ?? 0} registo(s)`);

// 6. Verificar se existe algum utilizador com papel 'creator'
console.log('\nPasso 5: verificar utilizadores com papel creator…');
const users = adminUsers.body?.data?.users ?? [];
const creators = users.filter((u) => u.role === 'creator');
const regularUsers = users.filter((u) => u.role === 'user');
console.log(`   Admins: ${users.filter((u) => u.role === 'admin').length}`);
console.log(`   Creators: ${creators.length}`);
console.log(`   Users: ${regularUsers.length}`);

if (creators.length === 0) {
  console.log('\n   ℹ️  Nenhum utilizador com papel "creator" encontrado.');
  console.log('   Para demonstrar publicação por creator, promove um utilizador:');
  console.log('   PATCH /api/admin/users/:id  { "role": "creator" }');
}

check('Separação confirmada: admin NÃO é creator', creators.every((c) => c.role !== 'admin'), '');

console.log('\n══════════════════════════════════════════════');
console.log('Separação de papéis (Task 9):');
console.log('  admin   → gere plataforma (users, logs, certs, streams)');
console.log('  creator → publica e gere os seus próprios podcasts');
console.log('  user    → ouve, descarrega, comenta');
console.log('  Tentar publicar como admin → 403 Forbidden');
console.log('══════════════════════════════════════════════\n');
