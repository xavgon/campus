import type { NextFunction, Request, Response } from 'express';
import type { TLSSocket } from 'tls';
import type { PeerCertificate } from 'tls';
import { AppError } from './errorHandler';
import { isClientAllowed } from '../security/allowedClients';

/**
 * Verifica se o certificado tem o Extended Key Usage (EKU) para autenticação de cliente.
 * O OID 1.3.6.1.5.5.7.3.2 corresponde a "TLS Web Client Authentication".
 * Isso impede que o certificado do servidor seja usado como certificado de cliente.
 */
const isClientAuthCert = (cert: PeerCertificate): boolean => {
  // Node.js expõe o EKU via cert.ext_key_usage (array de OIDs)
  const eku = (cert as PeerCertificate & { ext_key_usage?: string[] }).ext_key_usage;
  if (Array.isArray(eku)) {
    return eku.includes('1.3.6.1.5.5.7.3.2'); // clientAuth OID
  }
  // Sem EKU definido → rejeitar (exige clientAuth explícito)
  return false;
};

/**
 * Middleware de autenticação por certificado de cliente (mTLS — Task 1 / Task 2).
 *
 * O servidor foi configurado com requestCert: true, rejectUnauthorized: false,
 * pelo que este middleware é responsável por tomar a decisão de acesso:
 *
 *   1. Cliente apresenta certificado válido assinado pela CA → PERMITIDO
 *   2. Cliente apresenta certificado inválido/adulterado   → NEGADO (403)
 *   3. Cliente sem certificado + está na allowlist (Task 8) → PERMITIDO
 *   4. Cliente sem certificado                             → NEGADO (401)
 */
export const requireClientCert = (req: Request, _res: Response, next: NextFunction): void => {
  const socket = req.socket as TLSSocket;

  // Fallback: se o servidor estiver em HTTP (sem TLS) ignora a verificação
  if (typeof socket.getPeerCertificate !== 'function') {
    next();
    return;
  }

  const cert = socket.getPeerCertificate(true);
  const authorized = socket.authorized;

  // Caso 1: certificado válido assinado pela CA com EKU clientAuth
  const hasClientAuth = authorized && cert?.subject?.CN && isClientAuthCert(cert);
  if (hasClientAuth) {
    req.clientCert = {
      cn: String(cert.subject.CN),
      fingerprint: String(cert.fingerprint256 ?? cert.fingerprint),
      validFrom: cert.valid_from ? String(cert.valid_from) : undefined,
      validTo: cert.valid_to ? String(cert.valid_to) : undefined,
      issuer: cert.issuer?.CN ? String(cert.issuer.CN) : 'unknown',
    };
    next();
    return;
  }

  // Caso 2: certificado assinado pela CA mas sem EKU clientAuth (ex: cert do servidor)
  if (authorized && cert?.subject?.CN) {
    throw new AppError(
      'Certificado não autorizado para autenticação de cliente (EKU clientAuth ausente).',
      403,
    );
  }

  // Caso 3: tem certificado mas não é reconhecido pela CA (adulterado / CA errada)
  const hasCert = cert && typeof cert === 'object' && Object.keys(cert).length > 0 && !!cert.subject;
  if (hasCert) {
    throw new AppError(
      `Certificado inválido ou não autorizado pela CA. Motivo: ${socket.authorizationError ?? 'desconhecido'}`,
      403,
    );
  }

  // Caso 3: sem certificado — verificar allowlist (Task 8)
  const clientIp = (req.ip ?? req.socket.remoteAddress ?? '').replace(/^::ffff:/, '');
  if (isClientAllowed(clientIp)) {
    next();
    return;
  }

  // Caso 4: sem certificado e não está na allowlist
  throw new AppError(
    'Acesso negado: certificado de cliente necessário. ' +
    'Instale o certificado emitido pela CA-CAMPUS ou contacte o administrador.',
    401,
  );
};
