import { getPool } from '../database/pool';
import { signLog, verifyLog, type LogPayload } from '../security/digitalSignature';

export interface ClientCertInfo {
  fingerprint: string;
  cn: string;
}

export interface AdminLogRow {
  id: number;
  user_id: string | null;
  user_nome: string | null;
  action: string;
  cert_fingerprint: string | null;
  cert_cn: string | null;
  signature: string | null;
  signature_valid: boolean | null;
  created_at: string;
}

/**
 * Insere um registo de log com assinatura digital (Task 3 — Não Repúdio).
 *
 * @param userId    ID do utilizador (null se anónimo)
 * @param action    Descrição da acção realizada
 * @param certInfo  Informação do certificado de cliente usado na acção
 */
export const insertLog = async (
  userId: string | null,
  action: string,
  certInfo?: ClientCertInfo | null,
): Promise<void> => {
  const timestamp = new Date().toISOString();

  const payload: LogPayload = {
    userId,
    action,
    certFingerprint: certInfo?.fingerprint ?? null,
    certCn: certInfo?.cn ?? null,
    timestamp,
  };

  const signature = signLog(payload);

  await getPool().query(
    `INSERT INTO logs (user_id, action, cert_fingerprint, cert_cn, signature, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, action, payload.certFingerprint, payload.certCn, signature, timestamp],
  );
};

export const listLogsForAdmin = async (limit = 100): Promise<AdminLogRow[]> => {
  const result = await getPool().query(
    `SELECT l.id, l.user_id, u.nome AS user_nome,
            l.action, l.cert_fingerprint, l.cert_cn, l.signature, l.created_at
     FROM logs l
     LEFT JOIN users u ON u.id = l.user_id
     ORDER BY l.created_at DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => {
    const createdAt =
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at);

    // Verificar integridade da assinatura em tempo real
    let signatureValid: boolean | null = null;
    if (row.signature) {
      const payload: LogPayload = {
        userId: row.user_id,
        action: row.action,
        certFingerprint: row.cert_fingerprint,
        certCn: row.cert_cn,
        timestamp: createdAt,
      };
      signatureValid = verifyLog(payload, row.signature);
    }

    return {
      id: row.id,
      user_id: row.user_id,
      user_nome: row.user_nome,
      action: row.action,
      cert_fingerprint: row.cert_fingerprint,
      cert_cn: row.cert_cn,
      signature: row.signature,
      signature_valid: signatureValid,
      created_at: createdAt,
    };
  });
};
