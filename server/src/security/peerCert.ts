import type { Socket } from 'net';
import type { PeerCertificate, TLSSocket } from 'tls';
import { isFingerprintRevoked, isFingerprintRegistered } from '../models/cert.model';
import { config } from '../config';
import type { ClientCertInfo } from '../models/log.model';
import { isClientAllowed } from './allowedClients';

/**
 * Task 1 — Validação partilhada de certificado de cliente (mTLS).
 * Usado pelo middleware HTTP e pelo gateway WebSocket live.
 */
export class PeerCertDeniedError extends Error {
  readonly statusCode: 401 | 403;

  constructor(message: string, statusCode: 401 | 403) {
    super(message);
    this.name = 'PeerCertDeniedError';
    this.statusCode = statusCode;
  }
}

const isTlsSocket = (socket: Socket): socket is TLSSocket =>
  typeof (socket as TLSSocket).getPeerCertificate === 'function';

const isClientAuthCert = (cert: PeerCertificate): boolean => {
  const eku = (cert as PeerCertificate & { ext_key_usage?: string[] }).ext_key_usage;
  if (Array.isArray(eku)) {
    return eku.includes('1.3.6.1.5.5.7.3.2');
  }
  return false;
};

const normalizeIp = (ip: string): string => ip.replace(/^::ffff:/, '');

/**
 * Avalia o certificado de cliente apresentado na ligação TLS.
 *
 * @returns ClientCertInfo se o cliente apresentou cert válido; null se passou pela allowlist.
 * @throws PeerCertDeniedError se o acesso for negado.
 */
export const authenticatePeerCert = async (
  socket: Socket,
  clientIp: string,
): Promise<ClientCertInfo | null> => {
  if (!isTlsSocket(socket)) {
    return null;
  }

  const cert = socket.getPeerCertificate(true);
  const authorized = socket.authorized;
  const ip = normalizeIp(clientIp);

  const hasClientAuth = authorized && cert?.subject?.CN && isClientAuthCert(cert);
  if (hasClientAuth) {
    const fingerprint = String(cert.fingerprint256 ?? cert.fingerprint);
    const revoked = await isFingerprintRevoked(fingerprint);
    if (revoked) {
      throw new PeerCertDeniedError(
        'Certificado revogado pela CA-CAMPUS. Contacte o administrador.',
        403,
      );
    }

    if (config.caRequireRegistration) {
      const registered = await isFingerprintRegistered(fingerprint);
      if (!registered) {
        throw new PeerCertDeniedError(
          'Certificado não registado pela CA-CAMPUS. Contacte o administrador para emissão.',
          403,
        );
      }
    }

    return {
      cn: String(cert.subject.CN),
      fingerprint,
    };
  }

  if (authorized && cert?.subject?.CN) {
    throw new PeerCertDeniedError(
      'Certificado não autorizado para autenticação de cliente (EKU clientAuth ausente).',
      403,
    );
  }

  const hasCert =
    cert && typeof cert === 'object' && Object.keys(cert).length > 0 && !!cert.subject;
  if (hasCert) {
    throw new PeerCertDeniedError(
      `Certificado inválido ou não autorizado pela CA. Motivo: ${socket.authorizationError ?? 'desconhecido'}`,
      403,
    );
  }

  if (isClientAllowed(ip)) {
    return null;
  }

  throw new PeerCertDeniedError(
    'Acesso negado: certificado de cliente necessário. ' +
      'Instale o certificado emitido pela CA-CAMPUS ou contacte o administrador.',
    401,
  );
};

export const peerCertClientIp = (req: { ip?: string; socket: Socket }): string =>
  normalizeIp(req.ip ?? req.socket.remoteAddress ?? '');
