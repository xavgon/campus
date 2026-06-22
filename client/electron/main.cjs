const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { configureWindowMenu } = require('./menu.cjs');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:5173';
const preloadPath = path.join(__dirname, 'preload.cjs');

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
    if (isDev && url.startsWith(DEV_URL)) return;
    if (!isDev && url.startsWith('file://')) return;
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
    show: false,
    frame: false,
    backgroundColor: '#080808',
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev,
    },
  });

  configureWindowMenu(mainWindow, { isDev });
  attachDesktopGuards(mainWindow);

  mainWindow.on('maximize', notifyMaximizedState);
  mainWindow.on('unmaximize', notifyMaximizedState);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  if (isDev) {
    mainWindow.loadURL(`${DEV_URL}/login`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

registerWindowControls();

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}
