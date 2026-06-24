import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const clientCertKey = path.resolve(__dirname, 'certs/servidor.key');
const clientCertCrt = path.resolve(__dirname, 'certs/servidor.crt');
const serverCertKey = path.resolve(__dirname, '../server/certs/servidor.key');
const serverCertCrt = path.resolve(__dirname, '../server/certs/servidor.crt');

/** HTTPS no browser (Vite) — opcional; certs em client/certs/ */
const hasClientHttps = fs.existsSync(clientCertKey) && fs.existsSync(clientCertCrt);
/** TLS da API — certs em server/certs/ (proxy tem de usar https:// se existirem) */
const hasServerTls = fs.existsSync(serverCertKey) && fs.existsSync(serverCertCrt);
const apiTarget = hasServerTls ? 'https://localhost:3001' : 'http://localhost:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    ...(hasClientHttps
      ? {
          https: {
            key: fs.readFileSync(clientCertKey),
            cert: fs.readFileSync(clientCertCrt),
          },
        }
      : {}),
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/live': {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  base: './',
});
