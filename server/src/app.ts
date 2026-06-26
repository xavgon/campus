import cors from 'cors';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { corsOptions } from './config/cors';
import { ensureSchemaPatches } from './database/ensureSchemaPatches';
import { ensureDefaultAdmin } from './database/seedAdmin';
import { initAllowlistFromDb } from './security/allowedClients';
import { attachLiveGateway } from './live/live.gateway';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requireClientCert } from './middleware/clientCert.middleware';
import { requireClientCertForUploads } from './middleware/clientCertUploads.middleware';
import { authRouter } from './routes/auth.routes';
import { categoriesRouter } from './routes/categories.routes';
import { healthRouter } from './routes/health.routes';
import { adminRouter } from './routes/admin.routes';
import { presenceRouter } from './routes/presence.routes';
import { podcastRouter } from './routes/podcast.routes';
import { streamRouter } from './routes/stream.routes';
import { liveRouter } from './routes/live.routes';
import { getApiIndex } from './controllers/api.controller';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Task 7 — Mitigação MITM: HSTS força HTTPS em futuros acessos
    hsts: {
      maxAge: 31536000,       // 1 ano
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// Task 7 — Mitigação MITM: cabeçalho personalizado com info do cert do servidor
// Task 1 — expor modo mTLS estrito (útil para testes e clientes)
app.use((_req, res, next) => {
  res.setHeader('X-Campus-CA', 'CA-CAMPUS/ISPTEC');
  res.setHeader('X-Campus-MTLS-Strict', config.mtlsStrict ? 'true' : 'false');
  next();
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 20 : 500,
  message: { success: false, message: 'Muitas tentativas seguidas. Aguarda 15 minutos e tenta de novo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', requireClientCertForUploads, express.static(path.join(__dirname, '..', config.uploadDir)));

// ── mTLS: verificação de certificado de cliente (Task 1 / Task 2) ─────────────
// Aplicado a todas as rotas da API. O middleware permite:
//   • Clientes com certificado válido assinado pela CA
//   • IPs na allowlist (Task 8 — excepção administrativa)
// Em desenvolvimento, localhost está na allowlist automaticamente (proxy Vite).
app.use('/api', requireClientCert);

app.get('/api', getApiIndex);

if (config.nodeEnv !== 'production') {
  app.get('/live-test', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'live-test.html'));
  });
}

app.use('/api/health', healthRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/presence', presenceRouter);
app.use('/api/podcasts', podcastRouter);
app.use('/api/stream', streamRouter);
app.use('/api/live', liveRouter);
app.use('/api/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const certsDir = path.join(__dirname, '..', 'certs');
const keyPath = path.join(certsDir, 'servidor.key');
const certPath = path.join(certsDir, 'servidor.crt');
const caPath = path.join(certsDir, 'ca.crt');
const hasTls = fs.existsSync(keyPath) && fs.existsSync(certPath);

const httpServer = hasTls
  ? https.createServer(
      {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        ca: fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined,
        // mTLS: pede certificado ao cliente mas não rejeita automaticamente
        // (a decisão de acesso é tomada pelo middleware requireClientCert)
        requestCert: true,
        rejectUnauthorized: false,
        // Task 7 — Mitigação MITM: apenas TLS moderno e cifras fortes
        minVersion: 'TLSv1.2' as const,
        ciphers: [
          'TLS_AES_256_GCM_SHA384',
          'TLS_CHACHA20_POLY1305_SHA256',
          'TLS_AES_128_GCM_SHA256',
          'ECDHE-RSA-AES256-GCM-SHA384',
          'ECDHE-RSA-AES128-GCM-SHA256',
        ].join(':'),
      },
      app,
    )
  : http.createServer(app);

attachLiveGateway(httpServer, hasTls);

httpServer.listen(config.port, () => {
  const scheme = hasTls ? 'https' : 'http';
  const wsScheme = hasTls ? 'wss' : 'ws';
  console.log(`[CAMPUS] API em ${scheme}://localhost:${config.port}`);
  console.log(`[CAMPUS] Live WS em ${wsScheme}://localhost:${config.port}/live (mTLS — Task 1)`);
  console.log(
    `[CAMPUS] [mTLS] Modo ${config.mtlsStrict ? 'ESTRITO' : 'permissivo'} ` +
      `(MTLS_STRICT=${config.mtlsStrict}; allowlist dev ${config.mtlsStrict ? 'OFF' : 'ON'})`,
  );
  if (config.nodeEnv === 'production' && !config.mtlsStrict) {
    console.warn('[CAMPUS] [mTLS] AVISO: MTLS_STRICT desactivado em produção — não recomendado.');
  }
  if (!hasTls && config.nodeEnv !== 'production') {
    console.warn('[CAMPUS] Certificados TLS não encontrados — a correr em HTTP (dev).');
  }

  if (config.smtp.enabled) {
    console.log(`[CAMPUS] SMTP activo (${config.smtp.host}:${config.smtp.port})`);
  } else if (config.nodeEnv !== 'production') {
    console.warn('[CAMPUS] SMTP não configurado — links de reset aparecem no log do servidor.');
  }

  if (config.databaseUrl) {
    void (async () => {
      try {
        await ensureSchemaPatches();
        await initAllowlistFromDb();
        if (config.nodeEnv !== 'production') {
          await ensureDefaultAdmin();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[CAMPUS] Arranque BD ignorado: ${message}`);
      }
    })();
  }
});

export default app;
