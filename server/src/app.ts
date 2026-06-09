import cors from 'cors';
import express from 'express';
import path from 'path';
import { config } from './config';
import { ensureSchemaPatches } from './database/ensureSchemaPatches';
import { ensureDefaultAdmin } from './database/seedAdmin';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authRouter } from './routes/auth.routes';
import { healthRouter } from './routes/health.routes';
import { adminRouter } from './routes/admin.routes';
import { presenceRouter } from './routes/presence.routes';
import { podcastRouter } from './routes/podcast.routes';

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', config.uploadDir)));

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/presence', presenceRouter);
app.use('/api/podcasts', podcastRouter);
app.use('/api/admin', adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
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
