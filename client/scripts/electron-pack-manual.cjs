const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const clientRoot = process.cwd();
const releaseDir = path.join(clientRoot, 'release');
const outDir = path.join(releaseDir, 'win-unpacked');
const electronDist = path.join(clientRoot, 'node_modules', 'electron', 'dist');
const appDir = path.join(outDir, 'resources', 'app');

const killCampusProcesses = () => {
  if (process.platform !== 'win32') return;
  spawnSync('taskkill', ['/F', '/IM', 'CAMPUS.exe', '/T'], { stdio: 'ignore' });
  spawnSync('taskkill', ['/F', '/IM', 'electron.exe', '/T'], { stdio: 'ignore' });
};

const copyTree = (src, dest) => {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
};

const applyWindowsIcon = (exePath) => {
  if (process.platform !== 'win32') return;
  const iconIco = path.join(clientRoot, 'build-resources', 'icon.ico');
  if (!fs.existsSync(iconIco)) {
    console.warn('[electron:pack] icon.ico em falta — corre npm run electron:icon');
    return;
  }

  const rceditExe = path.join(
    clientRoot,
    'node_modules',
    'rcedit',
    'bin',
    process.arch === 'x64' ? 'rcedit-x64.exe' : 'rcedit.exe',
  );
  if (!fs.existsSync(rceditExe)) {
    console.warn('[electron:pack] rcedit em falta — corre npm install');
    return;
  }

  const result = spawnSync(rceditExe, [exePath, '--set-icon', iconIco], { stdio: 'inherit' });
  if (result.status === 0) {
    console.log('[electron:pack] Icone aplicado ao executavel.');
  } else {
    console.warn('[electron:pack] Nao foi possivel aplicar o icone (rcedit).');
  }
};

const main = () => {
  if (!fs.existsSync(path.join(clientRoot, 'dist', 'index.html'))) {
    console.error('[electron:pack] dist/ em falta. Corre npm run build primeiro.');
    process.exit(1);
  }

  if (!fs.existsSync(path.join(electronDist, 'electron.exe'))) {
    console.error('[electron:pack] electron.exe não encontrado. Corre npm install.');
    process.exit(1);
  }

  killCampusProcesses();
  fs.mkdirSync(releaseDir, { recursive: true });

  try {
    fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 400 });
  } catch (error) {
    console.error('[electron:pack] Não foi possível limpar', outDir);
    console.error(error.message);
    console.error('Fecha CAMPUS/Explorador em release\\win-unpacked e tenta de novo.');
    process.exit(1);
  }

  console.log('[electron:pack] A copiar runtime Electron…');
  copyTree(electronDist, outDir);

  const campusExe = path.join(outDir, 'CAMPUS.exe');
  fs.renameSync(path.join(outDir, 'electron.exe'), campusExe);
  applyWindowsIcon(campusExe);

  const defaultAppAsar = path.join(outDir, 'resources', 'default_app.asar');
  if (fs.existsSync(defaultAppAsar)) {
    fs.rmSync(defaultAppAsar, { force: true });
  }

  console.log('[electron:pack] A copiar aplicação (dist + electron)…');
  fs.mkdirSync(appDir, { recursive: true });

  const appPackage = {
    name: 'campus-client',
    version: '1.0.0',
    description: 'CAMPUS — cliente desktop',
    main: 'electron/main.cjs',
  };
  fs.writeFileSync(path.join(appDir, 'package.json'), `${JSON.stringify(appPackage, null, 2)}\n`);

  copyTree(path.join(clientRoot, 'dist'), path.join(appDir, 'dist'));
  copyTree(path.join(clientRoot, 'electron'), path.join(appDir, 'electron'));

  console.log('\n✓ App pronta:', campusExe);
  console.log('  Podes executar directamente ou correr npm run electron:dist para o instalador .exe\n');
};

main();
