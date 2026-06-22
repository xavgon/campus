import type { CorsOptions } from 'cors';
import { config } from './index';

const LOCAL_DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/** Em dev aceita qualquer porta local (5173, 5174, …). Em produção só CLIENT_URL. */
export const corsOptions: CorsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (config.nodeEnv !== 'production' && LOCAL_DEV_ORIGIN.test(origin)) {
      callback(null, true);
      return;
    }

    if (origin === config.clientUrl) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
};
