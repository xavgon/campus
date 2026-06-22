const { app, BrowserWindow, Menu, dialog } = require('electron');

/**
 * Produção: sem barra Ficheiro/Editar/Ver — aspecto de app nativo.
 * Desenvolvimento: menu mínimo, oculto por defeito (Alt para revelar).
 * @param {BrowserWindow} mainWindow
 * @param {{ isDev: boolean }} options
 */
const configureWindowMenu = (mainWindow, { isDev }) => {
  if (!isDev) {
    Menu.setApplicationMenu(null);
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
    return;
  }

  const template = [
    {
      label: 'CAMPUS',
      submenu: [
        {
          label: 'Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.reload(),
        },
        {
          label: 'Ferramentas de programador',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar tudo' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Diminuir zoom' },
        { type: 'separator' },
        {
          label: 'Ecrã inteiro',
          accelerator: 'F11',
          click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()),
        },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre o CAMPUS',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre o CAMPUS',
              message: 'CAMPUS',
              detail: `Plataforma de podcasts educativos.\nVersão ${app.getVersion()}\n\nMultimédia 2026`,
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  mainWindow.setAutoHideMenuBar(true);
  mainWindow.setMenuBarVisibility(false);
};

module.exports = { configureWindowMenu };
