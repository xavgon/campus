/**
 * Importar client.p12 no armazém do sistema — Task 1
 * Password do pacote: campus
 *
 * Uso: node server/scripts/import-client-p12.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '../certs');
const p12Path = path.join(certsDir, 'client.p12');
const P12_PASSWORD = 'campus';

if (!fs.existsSync(p12Path)) {
  console.error('❌ client.p12 em falta. Corre: npm run certs:bootstrap (na pasta server)');
  process.exit(1);
}

console.log('\n══════════════════════════════════════════════');
console.log(' CAMPUS — Importar certificado de cliente (Task 1)');
console.log('══════════════════════════════════════════════');
console.log(` Ficheiro: ${p12Path}`);
console.log(` Password: ${P12_PASSWORD}\n`);

const platform = process.platform;

try {
  if (platform === 'win32') {
    execSync(`certutil -f -user -p ${P12_PASSWORD} -importpfx "${p12Path}"`, { stdio: 'inherit' });
    console.log('\n✅ Importado no armazém do utilizador (Windows).');
  } else if (platform === 'darwin') {
    const keychain = path.join(os.homedir(), 'Library/Keychains/login.keychain-db');
    execSync(
      `security import "${p12Path}" -k "${keychain}" -P ${P12_PASSWORD} -A -T /usr/bin/security`,
      { stdio: 'inherit' },
    );
    console.log('\n✅ Importado no Keychain (macOS). Reinicia o Electron se estiver aberto.');
  } else if (platform === 'linux') {
    const nssDb = path.join(os.homedir(), '.pki', 'nssdb');
    if (!fs.existsSync(nssDb)) {
      fs.mkdirSync(nssDb, { recursive: true });
      execSync(`certutil -d sql:${nssDb} -N --empty-password`, { stdio: 'inherit' });
    }
    execSync(`pk12util -i "${p12Path}" -d sql:${nssDb} -W ${P12_PASSWORD}`, { stdio: 'inherit' });
    console.log('\n✅ Importado na base NSS (Linux). Requer libnss3-tools instalado.');
  } else {
    console.log('Plataforma não suportada automaticamente. Importa manualmente:');
    printManual();
    process.exit(1);
  }
} catch (err) {
  console.error('\n❌ Importação automática falhou.');
  printManual();
  process.exit(1);
}

function printManual() {
  console.log(`
Importação manual do client.p12 (password: ${P12_PASSWORD}):

  Windows (PowerShell):
    certutil -f -user -p ${P12_PASSWORD} -importpfx "${p12Path}"

  macOS (Terminal):
    security import "${p12Path}" -k ~/Library/Keychains/login.keychain-db -P ${P12_PASSWORD} -A

  Linux (requer libnss3-tools):
    pk12util -i "${p12Path}" -d sql:$HOME/.pki/nssdb -W ${P12_PASSWORD}

  Alternativa (qualquer SO): duplo-clique em client.p12 e segue o assistente.
`);
}
