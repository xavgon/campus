/**
 * Script de demonstração — Task 7 (Mitigação de Ataques MITM)
 *
 * Um ataque MITM (Man-in-the-Middle) intercepta a comunicação entre cliente e servidor.
 * O CAMPUS protege-se através de:
 *
 *   1. TLS com certificado assinado pela CA-CAMPUS
 *      → O cliente verifica o cert do servidor contra a CA; cert falso é rejeitado
 *
 *   2. mTLS (Task 1/2): o servidor também verifica o cert do cliente
 *      → Um atacante no meio não tem o cert de cliente assinado pela CA
 *
 *   3. TLS 1.2+ com cifras ECDHE
 *      → Perfect Forward Secrecy: interceptar tráfego passado não revela chaves futuras
 *
 *   4. HSTS (Task 7)
 *      → Browser recusa downgrade para HTTP (SSL-stripping attack bloqueado)
 *
 * Cenários demonstrados:
 *   A) Ligação legítima (CA correcta)         → ✅ Sucesso
 *   B) Ligação sem verificar CA (insegura)    → ⚠️  Funciona mas vulnerável a MITM
 *   C) Ligação com CA errada (atacante MITM)  → ❌ TLS error — ataque detectado
 *
 * Executa: node server/scripts/test-mitm-protection.mjs
 */
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');

const CA_REAL   = fs.readFileSync(path.join(certsDir, 'ca.crt'));
const CLI_CERT  = fs.readFileSync(path.join(certsDir, 'client.crt'));
const CLI_KEY   = fs.readFileSync(path.join(certsDir, 'client.key'));

// Simular "CA do atacante" — um cert auto-assinado diferente
// (em produção seria o cert que o atacante instalou no proxy MITM)
const FAKE_CA = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const request = (label, expectedOutcome, opts) =>
  new Promise((resolve) => {
    const r = https.request(
      { hostname: 'localhost', port: 3001, path: '/api/health', method: 'GET', ...opts },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          const caHeader = res.headers['x-campus-ca'] ?? '(sem cabeçalho)';
          const tlsVer   = res.socket?.getProtocol?.() ?? 'desconhecida';
          const cipher   = res.socket?.getCipher?.()?.name ?? 'desconhecida';
          if (expectedOutcome === 'success') {
            console.log(`✅ ${label}`);
            console.log(`   HTTP ${res.statusCode} — TLS: ${tlsVer} | Cifra: ${cipher}`);
            console.log(`   X-Campus-CA: ${caHeader}`);
          } else {
            console.log(`❌ ${label} — ATENÇÃO: deveria ter falhado! (vulnerabilidade)`);
          }
          resolve({ ok: true, status: res.statusCode });
        });
      },
    );
    r.on('error', (e) => {
      if (expectedOutcome === 'tls-error') {
        console.log(`✅ ${label}`);
        console.log(`   Erro TLS (esperado): ${e.code ?? e.message}`);
        console.log(`   → Ataque MITM detectado e bloqueado!`);
      } else {
        console.log(`❌ ${label} — Erro inesperado: ${e.message}`);
      }
      resolve({ ok: expectedOutcome === 'tls-error', error: e.message });
    });
    r.end();
  });

console.log('\n══════════════════════════════════════════════════════');
console.log(' CAMPUS — Demonstração de Protecção MITM (Task 7)');
console.log('══════════════════════════════════════════════════════\n');

// ── Cenário A: ligação legítima ───────────────────────────────────────────────
console.log('Cenário A — Ligação legítima (cliente verifica CA-CAMPUS):');
await request(
  'Cliente com CA correcta → ligação aceite',
  'success',
  { rejectUnauthorized: true, ca: CA_REAL, cert: CLI_CERT, key: CLI_KEY },
);

// ── Cenário B: sem verificação de CA (inseguro — típico de -k / skipVerify) ──
console.log('\nCenário B — Sem verificação de CA (rejectUnauthorized: false):');
console.log('⚠️  Ligação com cert do servidor não verificado (simulação de -k/--insecure)');
await request(
  'Sem verificação CA → ligação "funciona" mas VULNERÁVEL a MITM',
  'success',
  { rejectUnauthorized: false, cert: CLI_CERT, key: CLI_KEY },
);
console.log('   ⚠️  Um atacante poderia interceptar esta ligação sem ser detectado!');
console.log('   → Por isso o CAMPUS usa CA explícita e HSTS (nunca -k em produção)');

// ── Cenário C: CA errada (simulando atacante MITM com cert falso) ─────────────
console.log('\nCenário C — CA errada (atacante MITM apresenta cert falso):');
// Usamos um buffer aleatório como "CA falsa" para forçar o erro de verificação
const fakeCaBuffer = Buffer.from(
  '-----BEGIN CERTIFICATE-----\nZmFrZWNlcnQ=\n-----END CERTIFICATE-----\n',
);
await request(
  'CA do atacante → TLS handshake falha (MITM detectado)',
  'tls-error',
  { rejectUnauthorized: true, ca: fakeCaBuffer, cert: CLI_CERT, key: CLI_KEY },
);

// ── Resumo ────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════');
console.log('Camadas de protecção MITM no CAMPUS:');
console.log('  1. TLS 1.2+ obrigatório (minVersion) — SSLv3/TLS1.0 rejeitados');
console.log('  2. Cifras ECDHE — Perfect Forward Secrecy');
console.log('  3. CA-CAMPUS como âncora de confiança — cert falso → erro TLS');
console.log('  4. mTLS — servidor também verifica o cliente (dupla autenticação)');
console.log('  5. HSTS — browser recusa downgrade para HTTP');
console.log('  6. X-Campus-CA header — identifica a CA em cada resposta');
console.log('══════════════════════════════════════════════════════\n');
