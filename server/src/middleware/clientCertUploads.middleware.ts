import type { NextFunction, Request, Response } from 'express';
import {
  authenticatePeerCert,
  peerCertClientIp,
  PeerCertDeniedError,
} from '../security/peerCert';
import { AppError } from './errorHandler';

/** Task 2 — ficheiros estáticos também exigem certificado de cliente (ou allowlist). */
export const requireClientCertForUploads = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    await authenticatePeerCert(req.socket, peerCertClientIp(req));
    next();
  } catch (err) {
    if (err instanceof PeerCertDeniedError) {
      next(new AppError(err.message, err.statusCode));
      return;
    }
    next(err);
  }
};
