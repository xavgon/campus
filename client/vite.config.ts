import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const clientCertKey = path.resolve(__dirname, 'certs/servidor.key');
const clientCertCrt = path.resolve(__dirname, 'certs/servidor.crt');
const serverCertKey = path.resolve(__dirname, '../server/certs/servidor.key');
const serverCertCrt = path.resolve(__dirname, '../server/certs/servidor.crt');

// Certificado de cliente para o proxy Vite (mTLS — Task 1)
// O proxy apresenta este certificado ao servidor em nome do browser.
const proxyCertKey = path.resolve(__dirname, '../server/certs/client.key');
const proxyCertCrt = path.resolve(__dirname, '../server/certs/client.crt');
const hasProxyCert = fs.existsSync(proxyCertKey) && fs.existsSync(proxyCertCrt);

/** HTTPS no browser (Vite) — opcional; certs em client/certs/ */
const hasClientHttps = fs.existsSync(clientCertKey) && fs.existsSync(clientCertCrt);
/** TLS da API — certs em server/certs/ (proxy tem de usar https:// se existirem) */
const hasServerTls = fs.existsSync(serverCertKey) && fs.existsSync(serverCertCrt);
const apiTarget = hasServerTls ? 'https://localhost:3001' : 'http://localhost:3001';

// Opções de mTLS para o proxy: envia certificado de cliente ao servidor
const proxyCertOptions = hasProxyCert
  ? { key: fs.readFileSync(proxyCertKey), cert: fs.readFileSync(proxyCertCrt) }
  : {};

/** Vite injecta crossorigin nos assets; com file:// no Electron o bundle não carrega. */
const stripCrossoriginForElectron = {
  name: 'strip-crossorigin-for-electron',
  apply: 'build' as const,
  transformIndexHtml(html: string) {
    return html.replace(/\s+crossorigin/g, '');
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), stripCrossoriginForElectron],
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
        ...proxyCertOptions,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
        ...proxyCertOptions,
      },
      '/live': {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
        secure: false,
        ...proxyCertOptions,
      },
    },
  },
  base: './',
});
