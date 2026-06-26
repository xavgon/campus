import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';
import { AppError } from './errorHandler';

/**
 * Task 2 — Em modo estrito, acções sensíveis exigem certificado real (não só allowlist).
 */
export const requireDeviceCertificate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (config.mtlsStrict && !req.clientCert) {
    next(
      new AppError(
        'Esta acção exige certificado de dispositivo instalado. ' +
          'Acesso por allowlist não é suficiente em modo estrito.',
        403,
      ),
    );
    return;
  }
  next();
};
