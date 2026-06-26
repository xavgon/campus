/**
 * Script de teste — RF02 (Gestão de perfis)
 * Executa: node server/scripts/test-rf02-profile.mjs
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
const TEST_USER = {
  nome: 'RF02 Tester',
  email: `rf02-${stamp}@campus.test`,
  password: 'Rf02Pass123!',
};
const UPDATED_NAME = 'RF02 Tester Actualizado';
const NEW_PASSWORD = 'Rf02NewPass456!';

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
  console.log('\n=== RF02 — Gestão de perfis ===\n');

  const registerRes = await request('POST', '/api/auth/register', TEST_USER);
  const token = registerRes.body?.data?.token;
  const userId = registerRes.body?.data?.user?.id;
  check('Registo para teste de perfil', registerRes.status === 201 && !!token);

  // Visualizar perfil
  const profileRes = await request('GET', '/api/auth/profile', null, authHeader(token));
  const profile = profileRes.body?.data?.user;
  check(
    'GET /profile devolve dados pessoais',
    profileRes.status === 200 &&
      profile?.email === TEST_USER.email &&
      profile?.nome === TEST_USER.nome &&
      !!profile?.created_at,
  );

  // Perfil sem autenticação
  const noAuth = await request('GET', '/api/auth/profile');
  check('GET /profile sem token devolve 401', noAuth.status === 401);

  // Actualizar nome
  const updateRes = await request(
    'PUT',
    '/api/auth/profile',
    { nome: UPDATED_NAME },
    authHeader(token),
  );
  const updatedNome = updateRes.body?.data?.user?.nome;
  check('PUT /profile actualiza o nome', updateRes.status === 200 && updatedNome === UPDATED_NAME);

  // Nome inválido
  const badName = await request('PUT', '/api/auth/profile', { nome: 'A' }, authHeader(token));
  check('PUT /profile com nome curto devolve 400', badName.status === 400);

  // Confirmar persistência
  const profileAfter = await request('GET', '/api/auth/profile', null, authHeader(token));
  check(
    'Nome persistido após actualização',
    profileAfter.body?.data?.user?.nome === UPDATED_NAME,
  );

  // Alterar password
  const pwdRes = await request(
    'PUT',
    '/api/auth/password',
    { currentPassword: TEST_USER.password, newPassword: NEW_PASSWORD },
    authHeader(token),
  );
  check('PUT /password altera a password', pwdRes.status === 200);

  // Password actual errada
  const badPwd = await request(
    'PUT',
    '/api/auth/password',
    { currentPassword: 'wrong', newPassword: 'Another123!' },
    authHeader(token),
  );
  check('PUT /password com password actual errada devolve 401', badPwd.status === 401);

  // Login com nova password
  const relogin = await request('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: NEW_PASSWORD,
  });
  const newToken = relogin.body?.data?.token;
  check('Login após alteração de password', relogin.status === 200 && !!newToken);

  // Actividade do utilizador
  const activityRes = await request('GET', '/api/auth/activity', null, authHeader(newToken));
  const logs = activityRes.body?.data?.logs ?? [];
  const actions = logs.map((l) => l.action);
  const hasProfileUpdate = actions.some((a) => a.includes('Perfil actualizado'));
  const hasPasswordChange = actions.some((a) => a.includes('Password alterada'));
  const hasLogin = actions.some((a) => a.startsWith('Login:'));
  check('GET /activity devolve lista de acções', activityRes.status === 200 && logs.length > 0);
  check('Actividade inclui login', hasLogin, actions.slice(0, 3).join(' | '));
  check('Actividade inclui actualização de perfil', hasProfileUpdate);
  check('Actividade inclui alteração de password', hasPasswordChange);

  // Actividade só do próprio utilizador
  const onlyOwn = logs.every((l) => l.id > 0);
  check('Entradas de actividade têm estrutura válida', onlyOwn && logs[0]?.created_at);

  // Actividade sem token
  const noAuthActivity = await request('GET', '/api/auth/activity');
  check('GET /activity sem token devolve 401', noAuthActivity.status === 401);

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF02 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF02:', err.message);
  process.exit(1);
});
