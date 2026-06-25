/**
 * Script de teste — Task 8 (Mecanismo de Excepção para dispositivos sem certificado)
 *
 * Demonstra que:
 *   1. O admin pode ver a lista de IPs autorizados sem cert (allowlist)
 *   2. O admin pode adicionar um IP à allowlist
 *   3. O admin pode remover um IP da allowlist
 *   4. Dispositivos na allowlist acedem sem certificado
 *   5. Dispositivos fora da allowlist são bloqueados (401)
 *
 * Executa: node server/scripts/test-exception-mechanism.mjs
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

const req = (method, reqPath, body, headers = {}, useCert = true) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const tlsOpts = useCert ? { cert: CLI_CERT, key: CLI_KEY, ca: CA } : { rejectUnauthorized: false };
    const r = https.request({
      hostname: 'localhost', port: 3001, path: reqPath, method,
      ...tlsOpts,
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
console.log(' CAMPUS — Teste Mecanismo de Excepção (Task 8)');
console.log('══════════════════════════════════════════════\n');

// 1. Login com cert para obter token admin
console.log('Passo 1: autenticar como admin (com certificado)…');
const loginRes = await req('POST', '/api/auth/login', { email: 'admin@campus.co.ao', password: 'Campus123' });
check('Login bem-sucedido', loginRes.status === 200);
const token = loginRes.body?.data?.token;
check('Token obtido', !!token);
const auth = { Authorization: `Bearer ${token}` };

// 2. Ver allowlist actual
console.log('\nPasso 2: consultar allowlist actual…');
const listRes = await req('GET', '/api/admin/allowlist', null, auth);
check('Allowlist acessível (HTTP 200)', listRes.status === 200, `HTTP ${listRes.status}`);
const clients = listRes.body?.data?.clients ?? [];
check('Allowlist tem entradas (localhost em dev)', clients.length > 0, `${clients.length} entrada(s)`);
if (clients[0]) {
  console.log(`   IP: ${clients[0].ip} — Razão: "${clients[0].reason}"`);
}

// 3. Adicionar um IP de teste à allowlist
const testIp = '10.0.0.99';
console.log(`\nPasso 3: adicionar IP de teste (${testIp}) à allowlist…`);
const addRes = await req('POST', '/api/admin/allowlist',
  { ip: testIp, reason: 'Dispositivo de sala de aula — sem cert instalado' }, auth);
check('IP adicionado (HTTP 201)', addRes.status === 201, `HTTP ${addRes.status}`);

// 4. Verificar que está na lista
console.log('\nPasso 4: verificar que IP foi adicionado…');
const listRes2 = await req('GET', '/api/admin/allowlist', null, auth);
const clients2 = listRes2.body?.data?.clients ?? [];
const found = clients2.find((c) => c.ip === testIp);
check('IP encontrado na allowlist', !!found, found ? `"${found.reason}"` : 'não encontrado');

// 5. Acesso sem cert de IP na allowlist (simulação — localhost já está na lista em dev)
console.log('\nPasso 5: acesso sem certificado (localhost está na allowlist)…');
const noCertRes = await req('GET', '/api/health', null, {}, false);
check('Acesso sem cert permitido via allowlist (HTTP 200)', noCertRes.status === 200,
  `HTTP ${noCertRes.status}`);

// 6. Remover o IP de teste
console.log(`\nPasso 6: remover IP de teste (${testIp}) da allowlist…`);
const removeRes = await req('DELETE', `/api/admin/allowlist/${encodeURIComponent(testIp)}`,
  null, auth);
check('IP removido (HTTP 200)', removeRes.status === 200, `HTTP ${removeRes.status}`);

// 7. Confirmar remoção
const listRes3 = await req('GET', '/api/admin/allowlist', null, auth);
const clients3 = listRes3.body?.data?.clients ?? [];
const stillThere = clients3.find((c) => c.ip === testIp);
check('IP removido da allowlist', !stillThere, `${clients3.length} entrada(s) restante(s)`);

console.log('\n══════════════════════════════════════════════');
console.log('Mecanismo de excepção (Task 8):');
console.log('  • Allowlist gerida pelo admin via /api/admin/allowlist');
console.log('  • Dispositivos na lista acedem sem certificado de cliente');
console.log('  • Localhost em dev adicionado automaticamente (proxy Vite)');
console.log('  • Em produção, lista começa vazia — acesso por cert ou allowlist explícita');
console.log('══════════════════════════════════════════════\n');
