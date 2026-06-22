import cors from 'cors';
import express from 'express';
import http from 'http';
import path from 'path';
import { config } from './config';
import { corsOptions } from './config/cors';
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
app.use('/api/auth', authRouter);
app.use('/api/presence', presenceRouter);
app.use('/api/podcasts', podcastRouter);
app.use('/api/stream', streamRouter);
app.use('/api/live', liveRouter);
app.use('/api/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = http.createServer(app);
attachLiveGateway(httpServer);

httpServer.listen(config.port, () => {
  console.log(`[CAMPUS] API em http://localhost:${config.port}`);

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
