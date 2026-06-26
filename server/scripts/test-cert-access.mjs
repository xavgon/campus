/**
 * Teste Acesso por Certificado — Task 2
 * Valida a dupla camada: dispositivo (mTLS) + utilizador (JWT).
 *
 * Executa: node server/scripts/test-cert-access.mjs
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

const ADMIN_EMAIL = 'admin@campus.co.ao';
const ADMIN_PASS = 'Campus123';

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (detail) console.log(`   → ${detail}`);
};

const request = (options, body = null) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'localhost',
        port: 3001,
        rejectUnauthorized: false,
        ...options,
      },
      (res) => {
        let raw = '';
        res.on('data', (d) => (raw += d));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(raw);
          } catch {
            /**/
          }
          resolve({ status: res.statusCode ?? 0, headers: res.headers, json, raw });
        });
      },
    );
    req.on('error', reject);
    if (body) {
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(body));
      req.write(body);
    }
    req.end();
  });

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Teste Acesso por Certificado (Task 2)');
console.log('══════════════════════════════════════════════\n');

const strictProbe = await request({ path: '/api/health', method: 'GET' });
const strict = strictProbe.headers['x-campus-mtls-strict'] === 'true';
console.log(
  strict
    ? 'ℹ️  Modo MTLS_STRICT — camada dispositivo obrigatória\n'
    : 'ℹ️  Modo permissivo (dev) — allowlist activa em localhost\n',
);

// ── Camada 1: dispositivo (mTLS) ─────────────────────────────────────────────

if (strict) {
  const noCert = await request({ path: '/api/health', method: 'GET' });
  check('Camada 1 — Sem certificado bloqueado (strict)', noCert.status === 401, `HTTP ${noCert.status}`);
} else {
  const noCert = await request({ path: '/api/health', method: 'GET' });
  check('Camada 1 — Sem certificado via allowlist (dev)', noCert.status === 200, `HTTP ${noCert.status}`);
}

const withCert = await request({
  path: '/api/health',
  method: 'GET',
  cert: CLI_CERT,
  key: CLI_KEY,
  ca: CA,
});
check('Camada 1 — Com certificado válido', withCert.status === 200, `HTTP ${withCert.status}`);
check(
  'Camada 1 — Cabeçalho X-Campus-Device-Mode',
  withCert.headers['x-campus-device-mode'] === 'certificate',
  withCert.headers['x-campus-device-mode'] ?? 'ausente',
);
check(
  'Camada 1 — CN do dispositivo exposto',
  !!withCert.headers['x-campus-client-cn'],
  withCert.headers['x-campus-client-cn'] ?? 'ausente',
);

// JWT sozinho não contorna mTLS em strict
if (strict) {
  const jwtOnly = await request({
    path: '/api/auth/profile',
    method: 'GET',
    headers: { Authorization: 'Bearer token-falso-qualquer' },
  });
  check(
    'Camada 1 — JWT sem certificado não passa (strict)',
    jwtOnly.status === 401,
    `HTTP ${jwtOnly.status}`,
  );
}

// ── Camada 2: utilizador (JWT) ─────────────────────────────────────────────────

const loginBody = JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS });
const login = await request(
  {
    path: '/api/auth/login',
    method: 'POST',
    cert: CLI_CERT,
    key: CLI_KEY,
    ca: CA,
  },
  loginBody,
);
const token = login.json?.data?.token;
check('Camada 2 — Login com cert + credenciais', login.status === 200 && !!token, `HTTP ${login.status}`);
check(
  'Camada 2 — deviceAccess no login',
  login.json?.data?.deviceAccess?.mode === 'certificate',
  `mode: ${login.json?.data?.deviceAccess?.mode ?? 'n/a'}`,
);

const profileNoJwt = await request({
  path: '/api/auth/profile',
  method: 'GET',
  cert: CLI_CERT,
  key: CLI_KEY,
  ca: CA,
});
check('Camada 2 — Rota protegida sem JWT', profileNoJwt.status === 401, `HTTP ${profileNoJwt.status}`);

const profile = await request({
  path: '/api/auth/profile',
  method: 'GET',
  cert: CLI_CERT,
  key: CLI_KEY,
  ca: CA,
  headers: { Authorization: `Bearer ${token}` },
});
check('Camada 2 — Cert + JWT acede ao perfil', profile.status === 200, `HTTP ${profile.status}`);

const access = await request({
  path: '/api/auth/access',
  method: 'GET',
  cert: CLI_CERT,
  key: CLI_KEY,
  ca: CA,
  headers: { Authorization: `Bearer ${token}` },
});
check('Camada 2 — GET /auth/access (dupla camada)', access.status === 200, `HTTP ${access.status}`);
check(
  'Camada 2 — layers.device + layers.user',
  access.json?.data?.layers?.device === 'certificate' && access.json?.data?.layers?.user === 'jwt',
  JSON.stringify(access.json?.data?.layers ?? {}),
);

console.log('\n══════════════════════════════════════════════');
console.log(' Modelo de acesso CAMPUS (Task 2):');
console.log('   Camada 1 — Dispositivo: certificado mTLS (ou allowlist admin)');
console.log('   Camada 2 — Utilizador:  JWT após login email/password');
console.log('   Ambas necessárias para acções autenticadas.');
if (!strict) {
  console.log('\n  Dica: MTLS_STRICT=true para validar bloqueio sem cert.');
}
console.log('══════════════════════════════════════════════\n');
