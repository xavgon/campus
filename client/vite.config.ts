import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const certKey = path.resolve(__dirname, 'certs/servidor.key');
const certCrt = path.resolve(__dirname, 'certs/servidor.crt');
const hasHttps = fs.existsSync(certKey) && fs.existsSync(certCrt);
const apiTarget = hasHttps ? 'https://localhost:3001' : 'http://localhost:3001';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    ...(hasHttps
      ? {
          https: {
            key: fs.readFileSync(certKey),
            cert: fs.readFileSync(certCrt),
          },
        }
      : {}),
    proxy: {
      '/api': {
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
