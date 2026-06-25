const { app, BrowserWindow, shell, ipcMain, session } = require('electron');
const fs = require('fs');
const path = require('path');
const { configureWindowMenu } = require('./menu.cjs');
const {
  registerCampusScheme,
  installCampusProtocol,
  campusAppUrl,
  resolveDistRoot,
} = require('./protocol.cjs');

registerCampusScheme();

const isDev = !app.isPackaged;
const isSmokeTest = process.argv.includes('--smoke-test');
const useViteDev = isDev && process.env.ELECTRON_VITE_DEV === '1' && !isSmokeTest;
const DEV_URL = 'http://localhost:5173';
const preloadPath = path.join(__dirname, 'preload.cjs');
const iconPath = path.join(__dirname, 'icon.png');
const distIndexPath = path.join(resolveDistRoot(), 'index.html');
const debugDesktop = process.env.CAMPUS_DEBUG === '1';

/** @type {BrowserWindow | null} */
let mainWindow = null;

if (process.platform === 'win32') {
  app.setAppUserModelId('co.ao.campus.app');
}

const notifyMaximizedState = () => {
  if (!mainWindow) return;
  mainWindow.webContents.send('window:maximized-changed', mainWindow.isMaximized());
};

const registerWindowControls = () => {
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);
};

const attachDesktopGuards = (win) => {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (useViteDev && url.startsWith(DEV_URL)) return;
    if (!useViteDev && (url.startsWith('campus://') || url.startsWith('file://'))) return;
    event.preventDefault();
  });
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'CAMPUS',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    frame: false,
    backgroundColor: '#080808',
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: useViteDev || debugDesktop,
      // Timers de captura de vídeo/áudio não podem ser limitados em segundo plano
      backgroundThrottling: false,
    },
  });

  configureWindowMenu(mainWindow, { isDev: useViteDev });
  attachDesktopGuards(mainWindow);

  mainWindow.on('maximize', notifyMaximizedState);
  mainWindow.on('unmaximize', notifyMaximizedState);

  const revealWindow = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  };

  const showFallbackTimer = setTimeout(() => {
    console.warn('[CAMPUS] ready-to-show em atraso — a mostrar janela.');
    revealWindow();
  }, 4000);

  mainWindow.once('ready-to-show', () => {
    clearTimeout(showFallbackTimer);
    revealWindow();
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error('[CAMPUS renderer]', message, sourceId ? `(${sourceId}:${line})` : '');
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    console.error('[CAMPUS] Falha ao carregar:', code, description, url);
    revealWindow();
    if (useViteDev || debugDesktop) mainWindow?.webContents.openDevTools({ mode: 'detach' });
  });

  const loadApp = () => {
    if (useViteDev) {
      return mainWindow.loadURL(`${DEV_URL}/#/login`);
    }
    if (fs.existsSync(distIndexPath)) {
      return mainWindow.loadURL(campusAppUrl('/login'));
    }
    console.error(
      '[CAMPUS] dist/ em falta. Corre npm run build ou usa npm run electron:dev (com Vite).',
    );
    return mainWindow.loadURL('data:text/html,<h1>CAMPUS</h1><p>Corre <code>npm run build</code> ou <code>npm run electron:dev</code>.</p>');
  };

  void loadApp().catch((error) => {
    console.error('[CAMPUS] Erro ao abrir a app:', error);
    mainWindow?.show();
  });

  if (isSmokeTest) {
    const smokeTimeout = setTimeout(() => {
      console.error('CAMPUS_SMOKE_TIMEOUT');
      app.exit(1);
    }, 25_000);

    mainWindow.webContents.once('did-finish-load', () => {
      clearTimeout(smokeTimeout);
      console.log('CAMPUS_SMOKE_OK');
      app.exit(0);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

registerWindowControls();

if (isSmokeTest) {
  app.disableHardwareAcceleration();
}

const gotSingleInstanceLock = isSmokeTest ? true : app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else if (isSmokeTest) {
  app.whenReady().then(async () => {
    if (!useViteDev) {
      await installCampusProtocol();
    }

    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      const host = request.hostname ?? '';
      if (host === 'localhost' || host === '127.0.0.1') {
        callback(0);
        return;
      }
      callback(-3);
    });
    createWindow();
  });
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    if (!useViteDev) {
      await installCampusProtocol();
    }

    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      const host = request.hostname ?? '';
      if (host === 'localhost' || host === '127.0.0.1') {
        callback(0);
        return;
      }
      callback(-3);
    });
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
