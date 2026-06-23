import cors from 'cors';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import https from 'https';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { ensureSchemaPatches } from './database/ensureSchemaPatches';
import { ensureDefaultAdmin } from './database/seedAdmin';
import { attachLiveGateway } from './live/live.gateway';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authRouter } from './routes/auth.routes';
import { healthRouter } from './routes/health.routes';
import { adminRouter } from './routes/admin.routes';
import { presenceRouter } from './routes/presence.routes';
import { podcastRouter } from './routes/podcast.routes';
import { streamRouter } from './routes/stream.routes';
import { liveRouter } from './routes/live.routes';

const app = express();

// ── Segurança: cabeçalhos HTTP ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // permite servir uploads ao cliente
}));

// ── Rate Limiting: protecção contra brute-force ───────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // janela de 15 minutos
  max: 20,                   // máximo 20 tentativas por IP
  message: { success: false, message: 'Demasiadas tentativas. Tenta novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', config.uploadDir)));

if (config.nodeEnv !== 'production') {
  app.get('/live-test', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'live-test.html'));
  });
}

// ── Rotas (rate limiter aplicado nas rotas de auth) ───────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/presence', presenceRouter);
app.use('/api/podcasts', podcastRouter);
app.use('/api/stream', streamRouter);
app.use('/api/live', liveRouter);
app.use('/api/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// ── Servidor HTTPS ────────────────────────────────────────────────────────
const certsDir = path.join(__dirname, '..', 'certs');
const sslOptions = {
  key:  fs.readFileSync(path.join(certsDir, 'servidor.key')),
  cert: fs.readFileSync(path.join(certsDir, 'servidor.crt')),
  ca:   fs.readFileSync(path.join(certsDir, 'ca.crt')),
};

const httpsServer = https.createServer(sslOptions, app);
attachLiveGateway(httpsServer);

httpsServer.listen(config.port, () => {
  console.log(`[CAMPUS] API segura em https://localhost:${config.port}`);

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
