const { app, BrowserWindow, Menu, dialog } = require('electron');

/**
 * Menu nativo estilo aplicação Windows (Ficheiro, Editar, Ver, Janela, Ajuda).
 * @param {BrowserWindow} mainWindow
 * @param {{ isDev: boolean }} options
 */
const buildApplicationMenu = (mainWindow, { isDev }) => {
  const template = [
    {
      label: 'Ficheiro',
      submenu: [
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
        {
          label: 'Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.reload(),
        },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom normal' },
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Diminuir zoom' },
        { type: 'separator' },
        {
          label: 'Ecrã inteiro',
          accelerator: 'F11',
          click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()),
        },
        ...(isDev
          ? [
              { type: 'separator' },
              {
                label: 'Ferramentas de programador',
                accelerator: 'CmdOrCtrl+Shift+I',
                click: () => mainWindow?.webContents.toggleDevTools(),
              },
            ]
          : []),
      ],
    },
    {
      label: 'Janela',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'close', label: 'Fechar' },
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

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

module.exports = { buildApplicationMenu };
