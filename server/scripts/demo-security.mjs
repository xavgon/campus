/**
 * CAMPUS — Demo de Segurança (Task 10)
 * Corre todos os cenários de segurança em sequência.
 *
 * Pré-requisitos:
 *   • Servidor a correr: npm run dev (na pasta server/)
 *   • Certificados gerados em server/certs/
 *
 * Executa: node server/scripts/demo-security.mjs
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCRIPTS = [
  { task: 'Task 1 & 2', label: 'mTLS — Verificação de Certificado de Cliente',     file: 'test-mtls.mjs' },
  { task: 'Task 3',     label: 'Não Repúdio — Assinatura Digital nos Logs',         file: 'test-nonrepudiation.mjs' },
  { task: 'Task 4',     label: 'Gestão de CA — Emissão e Revogação de Certs',       file: null, note: 'Demonstrar: node server/scripts/issue-client-cert.mjs <cn> <email>' },
  { task: 'Task 5',     label: 'Protecção contra Pirataria — Identidade no Download', file: 'test-piracy-protection.mjs' },
  { task: 'Task 6',     label: 'Validação de Autoria — Cert do Autor no Podcast',   file: 'test-authorship.mjs' },
  { task: 'Task 7',     label: 'Mitigação MITM — TLS Reforçado + HSTS',             file: 'test-mitm-protection.mjs' },
  { task: 'Task 8',     label: 'Mecanismo de Excepção — Allowlist sem Certificado', file: 'test-exception-mechanism.mjs' },
  { task: 'Task 9',     label: 'Separação de Papéis — Admin não publica Podcasts',  file: 'test-role-separation.mjs' },
];

const sep = '═'.repeat(54);

console.log(`\n${sep}`);
console.log(' CAMPUS — Demonstração de Segurança Completa (Task 10)');
console.log(` Professor Bongo — ${new Date().toLocaleDateString('pt-PT')}`);
console.log(`${sep}\n`);

let passed = 0;
let skipped = 0;

for (const s of SCRIPTS) {
  console.log(`\n${'─'.repeat(54)}`);
  console.log(` ${s.task}: ${s.label}`);
  console.log(`${'─'.repeat(54)}`);

  if (!s.file) {
    console.log(`\n  ℹ️  ${s.note}\n`);
    skipped++;
    continue;
  }

  try {
    const scriptPath = path.join(__dirname, s.file);
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
    passed++;
  } catch {
    console.error(`\n  ❌ Falha ao executar ${s.file}\n`);
  }
}

console.log(`\n${sep}`);
console.log(` Resultado: ${passed} scripts executados, ${skipped} demonstração manual`);
console.log(`${sep}\n`);
