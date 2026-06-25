/**
 * Assinatura Digital — Task 3 (Não Repúdio)
 *
 * Cada entrada no log é assinada com a chave privada do servidor (RSA-SHA256).
 * Isso garante:
 *   • Autenticidade — só o servidor pode gerar assinaturas válidas
 *   • Integridade  — qualquer alteração no log invalida a assinatura
 *   • Não repúdio  — o utilizador não pode negar a acção (está associada ao seu ID + certificado)
 *
 * Para verificar: qualquer um com o certificado público do servidor (servidor.crt)
 * pode confirmar que a assinatura é válida.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const certsDir = path.join(__dirname, '..', '..', 'certs');
const keyPath = path.join(certsDir, 'servidor.key');

let serverPrivateKey: string | null = null;

const getPrivateKey = (): string | null => {
  if (serverPrivateKey) return serverPrivateKey;
  if (fs.existsSync(keyPath)) {
    serverPrivateKey = fs.readFileSync(keyPath, 'utf8');
    return serverPrivateKey;
  }
  return null;
};

/**
 * Dados que compõem a mensagem assinada.
 * Qualquer alteração a estes campos torna a assinatura inválida.
 */
export interface LogPayload {
  userId: string | null;
  action: string;
  certFingerprint: string | null;
  certCn: string | null;
  timestamp: string; // ISO 8601
}

/**
 * Assina o payload do log com a chave privada RSA do servidor (SHA-256).
 * Devolve a assinatura em Base64 ou null se não houver chave privada.
 */
export const signLog = (payload: LogPayload): string | null => {
  const key = getPrivateKey();
  if (!key) return null;

  const message = [
    payload.userId ?? 'anonymous',
    payload.action,
    payload.certFingerprint ?? 'no-cert',
    payload.certCn ?? 'no-cn',
    payload.timestamp,
  ].join('|');

  try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(key, 'base64');
  } catch {
    return null;
  }
};

/**
 * Verifica se a assinatura de um log é válida.
 * Usa o certificado público do servidor (disponível publicamente).
 */
export const verifyLog = (payload: LogPayload, signature: string): boolean => {
  const certPath = path.join(certsDir, 'servidor.crt');
  if (!fs.existsSync(certPath)) return false;

  const cert = fs.readFileSync(certPath, 'utf8');
  const message = [
    payload.userId ?? 'anonymous',
    payload.action,
    payload.certFingerprint ?? 'no-cert',
    payload.certCn ?? 'no-cn',
    payload.timestamp,
  ].join('|');

  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(message);
    return verify.verify(cert, signature, 'base64');
  } catch {
    return false;
  }
};
