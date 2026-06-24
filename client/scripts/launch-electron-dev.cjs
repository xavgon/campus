const { spawn } = require('child_process');

const child = spawn(require('electron'), ['.'], {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_VITE_DEV: '1' },
});

child.on('close', (code) => process.exit(code ?? 0));
