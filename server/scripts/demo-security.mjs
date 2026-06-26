/**
 * CAMPUS — Demo de Segurança (Task 10)
 * Corre todos os cenários de segurança em sequência.
 *
 * Pré-requisitos:
 *   • Servidor a correr: npm run dev (na pasta server/)
 *   • Certificados gerados em server/certs/
 *
 * Executa: node server/scripts/demo-security.mjs
 *          npm run demo:security   (na pasta server/)
 */
import { execSync } from 'child_process';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const SCRIPTS = [
  { task: '1 & 2', label: 'mTLS — Verificação de Certificado de Cliente', file: 'test-mtls.mjs' },
  { task: '2', label: 'Acesso por Certificado — Dispositivo + JWT', file: 'test-cert-access.mjs' },
  { task: '1', label: 'mTLS — WebSocket Live (wss://)', file: 'test-wss-mtls.mjs' },
  { task: '3', label: 'Não Repúdio — Assinatura Digital nos Logs', file: 'test-nonrepudiation.mjs' },
  { task: '4', label: 'Gestão de CA — Emissão e Revogação de Certs', file: 'test-ca-management.mjs' },
  { task: '5', label: 'Protecção contra Pirataria — Identidade no Download', file: 'test-piracy-protection.mjs' },
  { task: '6', label: 'Validação de Autoria — Cert do Autor no Podcast', file: 'test-authorship.mjs' },
  { task: '7', label: 'Mitigação MITM — TLS Reforçado + HSTS', file: 'test-mitm-protection.mjs' },
  { task: '8', label: 'Mecanismo de Excepção — Allowlist sem Certificado', file: 'test-exception-mechanism.mjs' },
  { task: '9', label: 'Separação de Papéis — Admin não publica Podcasts', file: 'test-role-separation.mjs' },
];

const sep = '═'.repeat(54);

const checkServer = () =>
  new Promise((resolve) => {
    const hasCert = fs.existsSync(path.join(certsDir, 'client.crt'));
    const tlsOpts = hasCert
      ? {
          rejectUnauthorized: false,
          cert: fs.readFileSync(path.join(certsDir, 'client.crt')),
          key: fs.readFileSync(path.join(certsDir, 'client.key')),
          ca: fs.readFileSync(path.join(certsDir, 'ca.crt')),
        }
      : { rejectUnauthorized: false };

    const r = https.request(
      { hostname: 'localhost', port: 3001, path: '/api/health', method: 'GET', ...tlsOpts },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      },
    );
    r.on('error', () => resolve(false));
    r.setTimeout(4000, () => {
      r.destroy();
      resolve(false);
    });
    r.end();
  });

console.log(`\n${sep}`);
console.log(' CAMPUS — Demonstração de Segurança Completa (Task 10)');
console.log(` ${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}`);
console.log(sep);

console.log('\nPré-voo: verificar servidor HTTPS em localhost:3001…');
const serverOk = await checkServer();
if (!serverOk) {
  console.error('\n❌ Servidor indisponível. Corre primeiro: cd server && npm run dev\n');
  process.exit(1);
}
console.log('✅ API acessível\n');

const results = [];

for (const s of SCRIPTS) {
  console.log(`\n${'─'.repeat(54)}`);
  console.log(` Task ${s.task}: ${s.label}`);
  console.log(`${'─'.repeat(54)}`);

  try {
    const scriptPath = path.join(__dirname, s.file);
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    results.push({ ...s, ok: true });
  } catch {
    console.error(`\n  ❌ Falha em ${s.file}\n`);
    results.push({ ...s, ok: false });
  }
}

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;

console.log(`\n${sep}`);
console.log(' RESUMO TASK 10');
console.log(sep);
for (const r of results) {
  console.log(` ${r.ok ? '✅' : '❌'} Task ${r.task.padEnd(4)} — ${r.label}`);
}
console.log(sep);
console.log(` Total: ${passed}/${results.length} scripts OK${failed ? ` · ${failed} falha(s)` : ''}`);
console.log(`${sep}\n`);

if (failed > 0) process.exit(1);
