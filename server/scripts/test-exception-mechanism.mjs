/**
 * Script de teste — Task 8 (Mecanismo de Excepção para dispositivos sem certificado)
 * Executa: node server/scripts/test-exception-mechanism.mjs
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

const request = (method, reqPath, body = null, extraHeaders = {}, useCert = true) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const tlsOpts = useCert
      ? { rejectUnauthorized: false, cert: CLI_CERT, key: CLI_KEY, ca: CA }
      : { rejectUnauthorized: false };

    const r = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        path: reqPath,
        method,
        ...tlsOpts,
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

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste Mecanismo de Excepção (Task 8)');
console.log('══════════════════════════════════════════════\n');

console.log('Passo 1: autenticar como admin…');
const loginRes = await request('POST', '/api/auth/login', {
  email: 'admin@campus.co.ao',
  password: 'Campus123',
});
check('Login bem-sucedido', loginRes.status === 200);
const token = loginRes.body?.data?.token;
const auth = { Authorization: `Bearer ${token}` };

console.log('\nPasso 2: consultar allowlist (persistida na BD)…');
const listRes = await request('GET', '/api/admin/allowlist', null, auth);
const clients = listRes.body?.data?.clients ?? [];
check('GET /admin/allowlist', listRes.status === 200, `${clients.length} entrada(s)`);
check('Localhost em dev', clients.some((c) => c.ip === '127.0.0.1' || c.ip === '::1'));

const testIp = '10.0.0.99';
console.log(`\nPasso 3: adicionar IP de teste (${testIp})…`);
const addRes = await request(
  'POST',
  '/api/admin/allowlist',
  { ip: testIp, reason: 'Dispositivo de sala de aula — sem cert instalado' },
  auth,
);
check('POST /admin/allowlist', addRes.status === 201, `HTTP ${addRes.status}`);

console.log('\nPasso 4: confirmar persistência na lista…');
const listRes2 = await request('GET', '/api/admin/allowlist', null, auth);
const found = (listRes2.body?.data?.clients ?? []).find((c) => c.ip === testIp);
check('IP encontrado após gravação', !!found, found?.reason ?? 'n/a');

console.log('\nPasso 5: acesso sem certificado via allowlist (localhost)…');
const noCertRes = await request('GET', '/api/health', null, {}, false);
check('Health sem cert em localhost', noCertRes.status === 200, `HTTP ${noCertRes.status}`);

console.log('\nPasso 6: log de auditoria da acção admin…');
const logsRes = await request('GET', '/api/admin/logs', null, auth);
const logs = logsRes.body?.data?.logs ?? [];
const allowLog = logs.find((log) => String(log.action).includes(`Allowlist: adicionou IP ${testIp}`));
check('Log assinado de adição', !!allowLog, allowLog?.action ?? 'não encontrado');

console.log(`\nPasso 7: remover IP de teste (${testIp})…`);
const removeRes = await request('DELETE', `/api/admin/allowlist/${encodeURIComponent(testIp)}`, null, auth);
check('DELETE /admin/allowlist/:ip', removeRes.status === 200, `HTTP ${removeRes.status}`);

const listRes3 = await request('GET', '/api/admin/allowlist', null, auth);
const stillThere = (listRes3.body?.data?.clients ?? []).find((c) => c.ip === testIp);
check('IP removido da BD', !stillThere);

console.log('\n══════════════════════════════════════════════');
console.log(' Mecanismo de excepção (Task 8):');
console.log('   • Tabela mtls_allowlist — persistência entre reinícios');
console.log('   • Admin UI: /admin/allowlist');
console.log('   • Dev: localhost incluído automaticamente');
console.log('   • Produção: lista vazia até o admin autorizar IPs');
console.log('══════════════════════════════════════════════\n');
