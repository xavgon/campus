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
import { attachLiveGateway } from './live/live.gateway';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authRouter } from './routes/auth.routes';
import { categoriesRouter } from './routes/categories.routes';
import { healthRouter } from './routes/health.routes';
import { adminRouter } from './routes/admin.routes';
import { presenceRouter } from './routes/presence.routes';
import { podcastRouter } from './routes/podcast.routes';
import { streamRouter } from './routes/stream.routes';
import { liveRouter } from './routes/live.routes';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Muitas tentativas seguidas. Aguarda 15 minutos e tenta de novo.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', config.uploadDir)));

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
        ...(fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath) } : {}),
      },
      app,
    )
  : http.createServer(app);

attachLiveGateway(httpServer);

httpServer.listen(config.port, () => {
  const scheme = hasTls ? 'https' : 'http';
  console.log(`[CAMPUS] API em ${scheme}://localhost:${config.port}`);
  if (!hasTls && config.nodeEnv !== 'production') {
    console.warn('[CAMPUS] Certificados TLS não encontrados — a correr em HTTP (dev).');
  }

  if (config.smtp.enabled) {
    console.log(`[CAMPUS] SMTP activo (${config.smtp.host}:${config.smtp.port})`);
  } else if (config.nodeEnv !== 'production') {
    console.warn('[CAMPUS] SMTP não configurado — links de reset aparecem no log do servidor.');
  }

  if (config.nodeEnv !== 'production' && config.databaseUrl) {
    void (async () => {
      try {
        await ensureSchemaPatches();
        await ensureDefaultAdmin();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[CAMPUS] Arranque BD ignorado: ${message}`);
      }
    })();
  }
});

export default app;
