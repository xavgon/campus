const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const clientRoot = process.cwd();
const distIndex = path.join(clientRoot, 'dist', 'index.html');
const unpackedDir = path.join(clientRoot, 'release', 'win-unpacked');
const campusExe = path.join(unpackedDir, 'CAMPUS.exe');
const appDist = path.join(unpackedDir, 'resources', 'app', 'dist', 'index.html');
const mainEntry = path.join(unpackedDir, 'resources', 'app', 'electron', 'main.cjs');

const fail = (message) => {
  console.error(`[electron:smoke] ✗ ${message}`);
  process.exit(1);
};

const ok = (message) => {
  console.log(`[electron:smoke] ✓ ${message}`);
};

console.log('[electron:smoke] A verificar artefactos do build…');

if (!fs.existsSync(distIndex)) {
  fail('dist/index.html em falta — corre npm run build');
}
ok('dist/index.html');

if (!fs.existsSync(campusExe)) {
  fail('release/win-unpacked/CAMPUS.exe em falta — corre node scripts/electron-pack-manual.cjs');
}
ok('CAMPUS.exe empacotado');

if (!fs.existsSync(appDist)) {
  fail('resources/app/dist/index.html em falta no pacote');
}
ok('UI incluída no pacote');

if (!fs.existsSync(mainEntry)) {
  fail('electron/main.cjs em falta no pacote');
}
ok('processo principal Electron');

if (process.platform !== 'win32') {
  console.log('[electron:smoke] Lançamento omitido (só Windows). Verificações de ficheiros concluídas.');
  process.exit(0);
}

console.log('[electron:smoke] A lançar CAMPUS.exe --smoke-test…');

const proc = spawn(campusExe, ['--smoke-test'], {
  cwd: unpackedDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let stdout = '';
let stderr = '';

proc.stdout.on('data', (chunk) => {
  const text = String(chunk);
  stdout += text;
  process.stdout.write(text);
});

proc.stderr.on('data', (chunk) => {
  const text = String(chunk);
  stderr += text;
  process.stderr.write(text);
});

const killTimer = setTimeout(() => {
  proc.kill('SIGKILL');
}, 30_000);

proc.on('close', (code) => {
  clearTimeout(killTimer);

  if (stdout.includes('CAMPUS_SMOKE_OK')) {
    ok('aplicação arrancou e carregou a UI');
    process.exit(0);
  }

  if (stderr.includes('CAMPUS_SMOKE_TIMEOUT') || stdout.includes('CAMPUS_SMOKE_TIMEOUT')) {
    fail('timeout ao carregar a janela Electron');
  }

  fail(`processo terminou com código ${code ?? 'desconhecido'} sem CAMPUS_SMOKE_OK`);
});

proc.on('error', (err) => {
  clearTimeout(killTimer);
  fail(`não foi possível executar CAMPUS.exe — ${err.message}`);
});
