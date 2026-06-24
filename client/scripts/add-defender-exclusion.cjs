const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

const clientRoot = process.cwd();
const buildOutDir = path.join(clientRoot, '.electron-build');
const legacyTempBuildDir = path.join(os.tmpdir(), 'campus-electron-build');
const electronCacheDir = path.join(clientRoot, '.electron-cache');
const paths = [clientRoot, buildOutDir, electronCacheDir, legacyTempBuildDir, os.tmpdir()];

console.log('A abrir PowerShell como Administrador…');
console.log('Exclusões Defender:');
paths.forEach((p) => console.log(' -', p));

const commands = paths
  .map((p) => `Add-MpPreference -ExclusionPath '${p.replace(/'/g, "''")}'`)
  .join('; ');

const inner = `${commands}; Write-Host ''; Write-Host 'Exclusoes aplicadas.' -ForegroundColor Green; pause`;

const result = spawnSync(
  'powershell',
  [
    '-NoProfile',
    '-Command',
    `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile','-Command','${inner.replace(/'/g, "''")}'`,
  ],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
