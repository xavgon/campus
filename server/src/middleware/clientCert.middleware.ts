import type { NextFunction, Request, Response } from 'express';
import { attachDeviceAccessHeaders } from '../security/deviceAccess';
import { authenticatePeerCert, peerCertClientIp, PeerCertDeniedError } from '../security/peerCert';
import { AppError } from './errorHandler';

/**
 * Middleware de autenticação por certificado de cliente (mTLS — Task 1 / Task 2).
 */
export const requireClientCert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const certInfo = await authenticatePeerCert(req.socket, peerCertClientIp(req));
    if (certInfo) {
      req.clientCert = {
        ...certInfo,
      };
    }
    attachDeviceAccessHeaders(req, res);
    next();
  } catch (err) {
    if (err instanceof PeerCertDeniedError) {
      next(new AppError(err.message, err.statusCode));
      return;
    }
    next(err);
  }
};
