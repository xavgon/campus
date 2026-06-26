/**
 * Script de teste — RF14 (API RESTful)
 * Verifica envelope JSON, recursos REST, descoberta GET /api,
 * rotas públicas/protegidas e convenções cliente-servidor.
 *
 * Executa: node server/scripts/test-rf14-api.mjs
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
let failures = 0;

const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (detail) console.log(`   → ${detail}`);
  if (!ok) failures += 1;
};

const isSuccessEnvelope = (body) =>
  body &&
  body.success === true &&
  typeof body.message === 'string' &&
  body.data !== undefined;

const isErrorEnvelope = (body) =>
  body && body.success === false && typeof body.message === 'string' && body.data === null;

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
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // mantém string
          }
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: parsed,
          });
        });
      },
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const run = async () => {
  console.log('\n=== RF14 — API RESTful ===\n');

  const indexRes = await request('GET', '/api');
  const index = indexRes.body?.data;
  check('GET /api devolve índice da API (200)', indexRes.status === 200);
  check('Índice usa envelope de sucesso', isSuccessEnvelope(indexRes.body));
  check('Índice identifica CAMPUS API', index?.name === 'CAMPUS API', index?.name);
  check('Índice declara baseUrl /api', index?.baseUrl === '/api');
  check('Índice documenta envelope JSON', !!index?.envelope?.success && !!index?.envelope?.error);
  check('Índice lista grupos de recursos', Array.isArray(index?.resources) && index.resources.length >= 6);
  check(
    'Recursos incluem auth, podcasts e health',
    ['auth', 'podcasts', 'health'].every((g) => index?.resources?.some((r) => r.group === g)),
  );

  const healthRes = await request('GET', '/api/health');
  check('GET /api/health devolve 200', healthRes.status === 200);
  check('Health usa envelope de sucesso', isSuccessEnvelope(healthRes.body));
  check('Health reporta serviço activo', healthRes.body?.data?.status === 'ok');
  check(
    'Resposta JSON (Content-Type)',
    String(healthRes.headers['content-type'] ?? '').includes('application/json'),
  );

  const notFound = await request('GET', '/api/rota-inexistente-rf14');
  check('Rota desconhecida devolve 404', notFound.status === 404);
  check('404 usa envelope de erro', isErrorEnvelope(notFound.body));

  const badRegister = await request('POST', '/api/auth/register', { email: 'invalido' });
  check('Validação inválida devolve 400', badRegister.status === 400);
  check('400 usa envelope de erro', isErrorEnvelope(badRegister.body));

  const categoriesRes = await request('GET', '/api/categories/public');
  check('GET /api/categories/public (público) devolve 200', categoriesRes.status === 200);
  check('Categorias usam envelope de sucesso', isSuccessEnvelope(categoriesRes.body));
  check(
    'Categorias devolvem array',
    Array.isArray(categoriesRes.body?.data?.categories),
  );

  const publicCatalog = await request('GET', '/api/podcasts/public?page=1&limit=5');
  check('GET /api/podcasts/public (público) devolve 200', publicCatalog.status === 200);
  check('Catálogo público com paginação', isSuccessEnvelope(publicCatalog.body));
  check(
    'Paginação no payload',
    publicCatalog.body?.data?.pagination?.page === 1 &&
      publicCatalog.body?.data?.pagination?.limit === 5,
  );

  const protectedRes = await request('GET', '/api/auth/profile');
  check('Rota protegida sem token devolve 401', protectedRes.status === 401);
  check('401 usa envelope de erro', isErrorEnvelope(protectedRes.body));

  const email = `rf14-${stamp}@campus.test`;
  const password = 'Rf14Pass123!';
  const registerRes = await request('POST', '/api/auth/register', {
    nome: 'RF14 API Tester',
    email,
    password,
  });
  const token = registerRes.body?.data?.token;
  check('POST /api/auth/register devolve 201', registerRes.status === 201);
  check('Registo usa envelope de sucesso', isSuccessEnvelope(registerRes.body));
  check('Registo devolve JWT', typeof token === 'string' && token.length > 10);

  const profileRes = await request('GET', '/api/auth/profile', null, authHeader(token));
  check('GET /api/auth/profile com Bearer devolve 200', profileRes.status === 200);
  check('Perfil devolve utilizador', profileRes.body?.data?.user?.email === email);

  const patchRes = await request(
    'PUT',
    '/api/auth/profile',
    { nome: 'RF14 Actualizado' },
    authHeader(token),
  );
  check('PUT /api/auth/profile actualiza recurso (200)', patchRes.status === 200);
  check(
    'PUT devolve dados actualizados',
    patchRes.body?.data?.user?.nome === 'RF14 Actualizado',
  );

  const becomeRes = await request('POST', '/api/auth/profile/become-creator', null, authHeader(token));
  const creatorToken = becomeRes.body?.data?.token ?? token;
  check('POST activa criador (200)', becomeRes.status === 200);

  const presenceRes = await request('GET', '/api/presence/online', null, authHeader(creatorToken));
  check('GET /api/presence/online devolve 200', presenceRes.status === 200);
  check('Presença usa envelope JSON', isSuccessEnvelope(presenceRes.body));

  const adminDenied = await request('GET', '/api/admin/overview', null, authHeader(creatorToken));
  check('Criador bloqueado no admin (403)', adminDenied.status === 403);
  check('403 usa envelope de erro', isErrorEnvelope(adminDenied.body));

  const corsRes = await request('GET', '/api/health', null, {
    Origin: 'http://localhost:5173',
  });
  const corsHeader = corsRes.headers['access-control-allow-origin'];
  check(
    'CORS permite origem localhost (dev)',
    corsHeader === 'http://localhost:5173' || corsHeader === '*',
    String(corsHeader),
  );

  check('Cabeçalho X-Campus-CA presente', healthRes.headers['x-campus-ca'] === 'CA-CAMPUS/ISPTEC');

  const methods = new Set(
    (index?.resources ?? []).flatMap((group) => group.endpoints.map((ep) => ep.method)),
  );
  check(
    'API expõe verbos REST (GET, POST, PUT, PATCH, DELETE)',
    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].every((m) => methods.has(m)),
    [...methods].join(', '),
  );

  console.log(`\n--- Resultado: ${failures === 0 ? 'RF14 OK' : `${failures} falha(s)`} ---\n`);
  process.exit(failures > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('Erro ao executar teste RF14:', err.message);
  process.exit(1);
});
