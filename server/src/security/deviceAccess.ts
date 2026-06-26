import type { Request, Response } from 'express';
import type { ClientCertInfo } from '../models/log.model';

/** Task 2 — Identidade do dispositivo na ligação (camada 1). */
export type DeviceAccessMode = 'certificate' | 'allowlist';

export interface DeviceAccess {
  mode: DeviceAccessMode;
  cn: string | null;
  fingerprint: string | null;
}

export const deviceAccessFromRequest = (req: Request): DeviceAccess => {
  const cert: ClientCertInfo | undefined = req.clientCert;
  if (cert) {
    return {
      mode: 'certificate',
      cn: cert.cn,
      fingerprint: cert.fingerprint,
    };
  }
  return {
    mode: 'allowlist',
    cn: null,
    fingerprint: null,
  };
};

/** Cabeçalhos HTTP para a camada de dispositivo (Task 2). */
export const attachDeviceAccessHeaders = (req: Request, res: Response): void => {
  const access = deviceAccessFromRequest(req);
  res.setHeader('X-Campus-Device-Mode', access.mode);
  if (access.cn) res.setHeader('X-Campus-Client-CN', access.cn);
  if (access.fingerprint) {
    res.setHeader('X-Campus-Client-Fingerprint', access.fingerprint);
  }
};
