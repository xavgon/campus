const fs = require('fs');
const path = require('path');

const targets = [
  'release/win-unpacked',
  'release/win-unpacked.tmp',
  'electron-dist/win-unpacked',
  'electron-dist/win-unpacked.tmp',
];

const stamp = Date.now();

const removeOrQuarantine = (abs, rel) => {
  if (!fs.existsSync(abs)) return true;

  try {
    fs.rmSync(abs, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    console.log(`removed ${rel}`);
    return true;
  } catch (error) {
    const staleName = `${path.basename(abs)}.stale-${stamp}`;
    const stalePath = path.join(path.dirname(abs), staleName);

    try {
      fs.renameSync(abs, stalePath);
      console.warn(`quarantined ${rel} -> ${staleName}`);
      return true;
    } catch (renameError) {
      console.warn(`could not remove ${rel}: ${error.message}`);
      console.warn(`could not quarantine ${rel}: ${renameError.message}`);
      return false;
    }
  }
};

let blocked = false;

for (const rel of targets) {
  const abs = path.join(process.cwd(), rel);
  if (!removeOrQuarantine(abs, rel)) blocked = true;
}

if (blocked) {
  console.warn(
    '\nPastas de build bloqueadas (Windows/antivírus). O electron-builder pode falhar com EPERM.',
  );
  console.warn(
    'Solução: Definições Windows → Privacidade e segurança → Segurança do Windows → Proteção contra vírus → Exclusões → adiciona a pasta client\\',
  );
}
