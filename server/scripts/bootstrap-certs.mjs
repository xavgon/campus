/**
 * Bootstrap da infraestrutura de certificados — Task 1
 *
 * Gera CA-CAMPUS, certificado do servidor, certificado de cliente (mTLS)
 * e pacote PKCS#12 para instalação no Electron/browser.
 *
 * Uso:
 *   node server/scripts/bootstrap-certs.mjs
 *   node server/scripts/bootstrap-certs.mjs --force
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');
const force = process.argv.includes('--force');
const P12_PASSWORD = 'campus';

const findOpenSSL = () => {
  const candidates = [
    'openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe',
  ];
  for (const bin of candidates) {
    try {
      execSync(`"${bin}" version`, { stdio: 'pipe' });
      return bin;
    } catch {
      /**/
    }
  }
  throw new Error(
    'openssl não encontrado. Instala Git para Windows (https://git-scm.com) ou adiciona openssl ao PATH.',
  );
};

const OPENSSL = findOpenSSL();
const run = (cmd, label) => {
  execSync(cmd, { stdio: 'pipe' });
  console.log(`   ✅ ${label}`);
};

const exists = (file) => fs.existsSync(path.join(certsDir, file));
const skip = (file) => exists(file) && !force;

if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });

console.log('\n══════════════════════════════════════════════');
console.log(' CA-CAMPUS — Bootstrap de Certificados (Task 1)');
console.log('══════════════════════════════════════════════\n');

// Garantir ficheiros de extensão OpenSSL
if (!exists('san.cnf')) {
  fs.writeFileSync(
    path.join(certsDir, 'san.cnf'),
    `[req]
distinguished_name = req_distinguished_name
[req_distinguished_name]
[v3_ext]
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
`,
  );
}

if (!exists('client_ext.cnf')) {
  fs.writeFileSync(
    path.join(certsDir, 'client_ext.cnf'),
    `[client_ext]
extendedKeyUsage = clientAuth
keyUsage = digitalSignature
`,
  );
}

// 1. CA raiz
if (!skip('ca.key') && !skip('ca.crt')) {
  console.log('1. Autoridade de Certificação (CA-CAMPUS)…');
  run(`"${OPENSSL}" genrsa -out "${path.join(certsDir, 'ca.key')}" 4096`, 'ca.key');
  run(
    `"${OPENSSL}" req -x509 -new -nodes -key "${path.join(certsDir, 'ca.key')}" -sha256 -days 3650 ` +
      `-out "${path.join(certsDir, 'ca.crt')}" -subj "/CN=CA-CAMPUS/O=ISPTEC/C=AO"`,
    'ca.crt',
  );
} else {
  console.log('1. CA-CAMPUS — já existe (usa --force para regenerar)');
}

// 2. Servidor HTTPS
if (!skip('servidor.key') && !skip('servidor.crt')) {
  console.log('\n2. Certificado do servidor (CN=localhost)…');
  run(`"${OPENSSL}" genrsa -out "${path.join(certsDir, 'servidor.key')}" 2048`, 'servidor.key');
  run(
    `"${OPENSSL}" req -new -key "${path.join(certsDir, 'servidor.key')}" ` +
      `-out "${path.join(certsDir, 'servidor.csr')}" -subj "/CN=localhost/O=ISPTEC/C=AO"`,
    'servidor.csr',
  );
  run(
    `"${OPENSSL}" x509 -req -in "${path.join(certsDir, 'servidor.csr')}" ` +
      `-CA "${path.join(certsDir, 'ca.crt')}" -CAkey "${path.join(certsDir, 'ca.key')}" -CAcreateserial ` +
      `-out "${path.join(certsDir, 'servidor.crt')}" -days 825 -sha256 ` +
      `-extfile "${path.join(certsDir, 'san.cnf')}" -extensions v3_ext`,
    'servidor.crt',
  );
} else {
  console.log('2. servidor.crt/key — já existe');
}

// 3. Cliente mTLS (campus-client)
if (!skip('client.key') && !skip('client.crt')) {
  console.log('\n3. Certificado de cliente mTLS (CN=campus-client)…');
  run(`"${OPENSSL}" genrsa -out "${path.join(certsDir, 'client.key')}" 2048`, 'client.key');
  run(
    `"${OPENSSL}" req -new -key "${path.join(certsDir, 'client.key')}" ` +
      `-out "${path.join(certsDir, 'client.csr')}" -subj "/CN=campus-client/O=ISPTEC/C=AO"`,
    'client.csr',
  );
  run(
    `"${OPENSSL}" x509 -req -in "${path.join(certsDir, 'client.csr')}" ` +
      `-CA "${path.join(certsDir, 'ca.crt')}" -CAkey "${path.join(certsDir, 'ca.key')}" -CAcreateserial ` +
      `-out "${path.join(certsDir, 'client.crt')}" -days 365 -sha256 ` +
      `-extfile "${path.join(certsDir, 'client_ext.cnf')}" -extensions client_ext`,
    'client.crt',
  );
} else {
  console.log('3. client.crt/key — já existe');
}

// 4. PKCS#12 para Electron / instalação manual
if (!skip('client.p12')) {
  console.log('\n4. Pacote PKCS#12 (client.p12) para Electron…');
  run(
    `"${OPENSSL}" pkcs12 -export -out "${path.join(certsDir, 'client.p12')}" ` +
      `-inkey "${path.join(certsDir, 'client.key')}" -in "${path.join(certsDir, 'client.crt')}" ` +
      `-certfile "${path.join(certsDir, 'ca.crt')}" -passout pass:${P12_PASSWORD} -name campus-client`,
    `client.p12 (password: ${P12_PASSWORD})`,
  );
} else {
  console.log('4. client.p12 — já existe');
}

console.log('\n══════════════════════════════════════════════');
console.log(' Infraestrutura de certificados pronta.');
console.log(' Próximo passo: cd server && npm run dev');
console.log(' Teste:        node server/scripts/test-mtls.mjs');
console.log('              node server/scripts/test-wss-mtls.mjs');
console.log(' Electron:     npm run certs:import-p12  (importar client.p12)');
console.log('══════════════════════════════════════════════\n');
