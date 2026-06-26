const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const clientRoot = process.cwd();
const releaseDir = path.join(clientRoot, 'release');
const unpackedDir = path.join(releaseDir, 'win-unpacked');
const campusExe = path.join(unpackedDir, 'CAMPUS.exe');
const setupExe = path.join(releaseDir, 'CAMPUS Setup 1.0.0.exe');

const printDefenderHelp = () => {
  console.error('\n--- Se o instalador NSIS falhar (EPERM) ---');
  console.error('Usa a app sem instalador: release\\win-unpacked\\CAMPUS.exe');
  console.error('Ou PowerShell Admin: npm run electron:defender && npm run electron:dist\n');
};

const killCampusProcesses = () => {
  if (process.platform !== 'win32') return;
  spawnSync('taskkill', ['/F', '/IM', 'CAMPUS.exe', '/T'], { stdio: 'ignore' });
  spawnSync('taskkill', ['/F', '/IM', 'electron.exe', '/T'], { stdio: 'ignore' });
};

console.log('[electron:dist] A preparar build Windows…');
killCampusProcesses();

spawnSync('node', ['./scripts/clean-electron-release.cjs'], {
  stdio: 'inherit',
  cwd: clientRoot,
});

const pack = spawnSync('node', ['./scripts/electron-pack-manual.cjs'], {
  stdio: 'inherit',
  cwd: clientRoot,
});

if (pack.status !== 0) {
  process.exit(pack.status ?? 1);
}

const dirOnly = process.argv.includes('--dir');

if (dirOnly) {
  process.exit(0);
}

if (!fs.existsSync(campusExe)) {
  console.error('[electron:dist] CAMPUS.exe em falta após empacotamento manual.');
  process.exit(1);
}

console.log('[electron:dist] A criar instalador NSIS (sem re-descompactar Electron)…');

const builderArgs = [
  'electron-builder',
  '--win',
  '--publish',
  'never',
  `--prepackaged=${unpackedDir}`,
  `--config.directories.output=${releaseDir}`,
];

let builder = { status: 1 };
const maxAttempts = 3;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  if (attempt > 1) {
    console.warn(`[electron:dist] Nova tentativa NSIS ${attempt}/${maxAttempts}…`);
    spawnSync('ping', ['127.0.0.1', '-n', '4'], { stdio: 'ignore', shell: true });
  }

  builder = spawnSync('npx', builderArgs, {
    stdio: 'inherit',
    cwd: clientRoot,
    shell: true,
  });

  if (builder.status === 0) break;
}

if (builder.status !== 0) {
  console.error('\n[electron:dist] Instalador NSIS falhou, mas a app empacotada está pronta:');
  console.error(' ', campusExe);
  printDefenderHelp();
  process.exit(builder.status ?? 1);
}

// electron-builder com --prepackaged pode deixar win-unpacked sem CAMPUS.exe — repack
console.log('[electron:dist] A restaurar pasta portable (CAMPUS.exe)…');
const repack = spawnSync('node', ['./scripts/electron-pack-manual.cjs'], {
  stdio: 'inherit',
  cwd: clientRoot,
});

if (repack.status !== 0) {
  console.error('[electron:dist] Falha ao restaurar portable.');
  process.exit(repack.status ?? 1);
}

const portableExe = path.join(unpackedDir, 'CAMPUS.exe');

if (fs.existsSync(setupExe)) {
  const stat = fs.statSync(setupExe);
  console.log('\n✓ Instalador:', setupExe);
  console.log('  Data:', stat.mtime.toLocaleString('pt-PT'));
  console.log('\n✓ App portable (sem instalador):', portableExe);
} else {
  console.log('\n✓ App portable:', portableExe);
}
