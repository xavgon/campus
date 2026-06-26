/**
 * Script de teste — Task 3 (Não Repúdio)
 * Verifica que:
 *   1. Login cria um registo de log com assinatura digital
 *   2. O log contém o fingerprint do certificado de cliente (se apresentado)
 *   3. A assinatura é verificável com o certificado público do servidor
 *
 * Executa: node server/scripts/test-nonrepudiation.mjs
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

// ── helpers ───────────────────────────────────────────────────────────────────

const request = (method, path, body, tlsOpts = {}) =>
  new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      ...tlsOpts,
    }, (res) => {
      let raw = '';
      res.on('data', (d) => (raw += d));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });

const check = (label, condition, detail = '') => {
  console.log(`${condition ? '✅' : '❌'} ${label}`);
  if (detail) console.log(`   → ${detail}`);
};

// ── test ─────────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste Não Repúdio (Task 3)');
console.log('══════════════════════════════════════════════\n');

// 1. Login com certificado de cliente válido
console.log('Passo 1: login com certificado de cliente (client.crt)…');
const loginRes = await request(
  'POST', '/api/auth/login',
  { email: 'admin@campus.co.ao', password: 'Campus123' },
  { cert: CLI_CERT, key: CLI_KEY, ca: CA },
);
check('Login bem-sucedido', loginRes.status === 200, `HTTP ${loginRes.status}`);
const token = loginRes.body?.data?.token;
check('Token JWT recebido', !!token);

// 2. Consultar logs como admin
console.log('\nPasso 2: consultar logs de actividade…');
const logsRes = await request('GET', '/api/admin/logs', null, {
  cert: CLI_CERT, key: CLI_KEY, ca: CA,
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// rebuild headers workaround (https.request merges but we set above)
const logsRes2 = await new Promise((resolve, reject) => {
  const req = https.request({
    hostname: 'localhost', port: 3001, path: '/api/admin/logs', method: 'GET',
    rejectUnauthorized: false, cert: CLI_CERT, key: CLI_KEY, ca: CA,
    headers: { Authorization: `Bearer ${token}` },
  }, (res) => {
    let raw = '';
    res.on('data', (d) => (raw += d));
    res.on('end', () => {
      try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
      catch { resolve({ status: res.statusCode, body: raw }); }
    });
  });
  req.on('error', reject);
  req.end();
});

check('Logs acessíveis (HTTP 200)', logsRes2.status === 200, `HTTP ${logsRes2.status}`);

const logs = logsRes2.body?.data?.logs ?? [];
check('Lista de logs não vazia', logs.length > 0, `${logs.length} entradas`);

// 3. Verificar o log de login mais recente
const loginLog = logs.find((l) => l.action?.startsWith('Login:'));
check('Log de login presente', !!loginLog, loginLog ? `action: "${loginLog.action}"` : 'não encontrado');

if (loginLog) {
  check('Fingerprint do certificado guardado', !!loginLog.cert_fingerprint, loginLog.cert_fingerprint ?? 'null');
  check('CN do certificado guardado', !!loginLog.cert_cn, loginLog.cert_cn ?? 'null');
  check('Assinatura digital presente', !!loginLog.signature, loginLog.signature ? loginLog.signature.substring(0, 40) + '…' : 'null');
  check('Assinatura válida (verificada pelo servidor)', loginLog.signature_valid === true, `signature_valid: ${loginLog.signature_valid}`);
}

const publishLog = logs.find((l) => l.action?.startsWith('Publicou:'));
const downloadLog = logs.find((l) => l.action?.startsWith('Download:'));
if (publishLog) {
  console.log('\nLog de publicação encontrado:');
  check('Publicação assinada', publishLog.signature_valid === true, publishLog.action);
} else {
  console.log('\nℹ️  Sem log de publicação ainda (publica um episódio como creator para testar).');
}
if (downloadLog) {
  console.log('\nLog de download encontrado:');
  check('Download assinado', downloadLog.signature_valid === true, downloadLog.action);
} else {
  console.log('ℹ️  Sem log de download ainda (descarrega um episódio para testar).');
}

console.log('\n══════════════════════════════════════════════');
console.log('Legenda:');
console.log('  ✅ = verificação passou');
console.log('  ❌ = falha (investigar)');
console.log('══════════════════════════════════════════════\n');
