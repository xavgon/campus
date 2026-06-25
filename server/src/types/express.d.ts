import type { AuthTokenPayload } from '../services/auth.service';
import type { ClientCertInfo } from '../models/log.model';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      clientCert?: ClientCertInfo & { validFrom?: string; validTo?: string; issuer?: string };
    }
  }
}

export {};
