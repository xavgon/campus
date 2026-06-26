/**
 * Script de teste — RF01 (Autenticação e gestão de contas)
 * Executa: node server/scripts/test-rf01-auth.mjs
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const JWT_SECRET = process.env.JWT_SECRET ?? 'campus-dev-secret-change-in-production';
const CA = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY = fs.readFileSync(path.join(certsDir, 'client.key'));

const ADMIN = { email: 'admin@campus.co.ao', password: 'Campus123' };
const stamp = Date.now();
const TEST_USER = {
  nome: 'RF01 Tester',
  email: `rf01-${stamp}@campus.test`,
  password: 'Rf01Pass123!',
};
const NEW_PASSWORD = 'Rf01NewPass456!';

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

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const run = async () => {
  console.log('\n=== RF01 — Autenticação e gestão de contas ===\n');

  // 1. Registo
  const registerRes = await request('POST', '/api/auth/register', {
    nome: TEST_USER.nome,
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  const userToken = registerRes.body?.data?.token;
  const userId = registerRes.body?.data?.user?.id;
  const userRole = registerRes.body?.data?.user?.role;
  check('Registo devolve 201 + token JWT', registerRes.status === 201 && !!userToken);
  check('Novo utilizador tem papel "user"', userRole === 'user', `role=${userRole}`);

  // 2. Registo duplicado
  const dupRes = await request('POST', '/api/auth/register', {
    nome: 'Outro',
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  check('Registo duplicado devolve 409', dupRes.status === 409);

  // 3. Login credenciais erradas
  const badLogin = await request('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: 'wrong-password',
  });
  check('Login com password errada devolve 401', badLogin.status === 401);

  // 4. Login válido
  const loginRes = await request('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  const loginToken = loginRes.body?.data?.token;
  check('Login válido devolve 200 + token', loginRes.status === 200 && !!loginToken);

  // 5. Perfil sem token
  const noAuthProfile = await request('GET', '/api/auth/profile');
  check('GET /profile sem token devolve 401', noAuthProfile.status === 401);

  // 6. Perfil com token
  const profileRes = await request('GET', '/api/auth/profile', null, authHeader(loginToken));
  const profileEmail = profileRes.body?.data?.user?.email;
  check('GET /profile com token devolve o utilizador', profileRes.status === 200 && profileEmail === TEST_USER.email);

  // 7. Forgot password (resposta genérica)
  const forgotRes = await request('POST', '/api/auth/forgot-password', { email: TEST_USER.email });
  check('POST /forgot-password devolve 200 (sem revelar existência)', forgotRes.status === 200);

  // 8. Reset password com token JWT
  const resetToken = jwt.sign({ userId, type: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
  const resetRes = await request('POST', '/api/auth/reset-password', {
    token: resetToken,
    newPassword: NEW_PASSWORD,
  });
  check('POST /reset-password com token válido devolve 200', resetRes.status === 200);

  // 9. Login com nova password
  const loginAfterReset = await request('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: NEW_PASSWORD,
  });
  const tokenAfterReset = loginAfterReset.body?.data?.token;
  check('Login após reset funciona com nova password', loginAfterReset.status === 200 && !!tokenAfterReset);

  // 10. Password antiga já não funciona
  const oldPassLogin = await request('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  check('Password antiga rejeitada após reset', oldPassLogin.status === 401);

  // 11. Utilizador acede área autenticada (podcasts)
  const podcastsRes = await request('GET', '/api/podcasts', null, authHeader(tokenAfterReset));
  check('Utilizador autenticado acede GET /podcasts', podcastsRes.status === 200);

  // 12. Utilizador não acede admin
  const adminDenied = await request('GET', '/api/admin/users', null, authHeader(tokenAfterReset));
  check('Utilizador comum não acede GET /admin/users (403)', adminDenied.status === 403);

  // 13. Admin login e papel
  const adminLogin = await request('POST', '/api/auth/login', ADMIN);
  const adminToken = adminLogin.body?.data?.token;
  const adminRole = adminLogin.body?.data?.user?.role;
  check('Admin login devolve papel "admin"', adminLogin.status === 200 && adminRole === 'admin');

  // 14. Admin acede painel
  const adminUsers = await request('GET', '/api/admin/users', null, authHeader(adminToken));
  check('Admin acede GET /admin/users', adminUsers.status === 200);

  // 15. Token inválido
  const badTokenProfile = await request('GET', '/api/auth/profile', null, {
    Authorization: 'Bearer invalid.token.here',
  });
  check('Token JWT inválido devolve 401', badTokenProfile.status === 401);

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF01 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF01:', err.message);
  process.exit(1);
});
