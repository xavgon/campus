const fs = require('fs');
const path = require('path');

const clientRoot = process.cwd();
const stamp = Date.now();

const collectTargets = () => {
  const relDirs = ['release', 'electron-dist', 'release2', '.electron-build'];
  const names = ['win-unpacked', 'win-unpacked.tmp'];
  const targets = [];

  for (const dir of relDirs) {
    for (const name of names) {
      targets.push(path.join(dir, name));
    }
  }

  for (const dir of relDirs) {
    const absDir = path.join(clientRoot, dir);
    if (!fs.existsSync(absDir)) continue;
    for (const entry of fs.readdirSync(absDir)) {
      if (entry.includes('.stale-') || entry.startsWith('win-unpacked.tmp.')) {
        targets.push(path.join(dir, entry));
      }
    }
  }

  return [...new Set(targets)];
};

const removeOrQuarantine = (abs, rel) => {
  if (!fs.existsSync(abs)) return true;

  try {
    fs.rmSync(abs, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
    console.log(`removed ${rel}`);
    return true;
  } catch (error) {
    const staleName = `${path.basename(abs)}.stale-${stamp}`;
    const stalePath = path.join(path.dirname(abs), staleName);

    try {
      fs.renameSync(abs, stalePath);
      console.warn(`quarantined ${rel} -> ${path.basename(stalePath)}`);
      return true;
    } catch (renameError) {
      console.warn(`could not remove ${rel}: ${error.message}`);
      return false;
    }
  }
};

let blocked = false;

for (const rel of collectTargets()) {
  const abs = path.join(clientRoot, rel);
  if (!removeOrQuarantine(abs, rel)) blocked = true;
}

if (blocked) {
  console.warn('\nAlgumas pastas de build estão bloqueadas (Explorador aberto ou antivírus).');
  process.exitCode = 1;
}
