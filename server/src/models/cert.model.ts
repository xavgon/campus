import { getPool } from '../database/pool';

export interface IssuedCert {
  id: number;
  cn: string;
  fingerprint: string | null;
  issued_to: string | null;
  issued_at: string;
  expires_at: string | null;
  revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export const listIssuedCerts = async (): Promise<IssuedCert[]> => {
  const result = await getPool().query(
    `SELECT id, cn, fingerprint, issued_to, issued_at, expires_at,
            revoked, revoked_at, revoked_reason
     FROM issued_certs
     ORDER BY issued_at DESC`,
  );
  return result.rows.map((r) => ({
    ...r,
    issued_at: r.issued_at instanceof Date ? r.issued_at.toISOString() : String(r.issued_at),
    expires_at: r.expires_at ? (r.expires_at instanceof Date ? r.expires_at.toISOString() : String(r.expires_at)) : null,
    revoked_at: r.revoked_at ? (r.revoked_at instanceof Date ? r.revoked_at.toISOString() : String(r.revoked_at)) : null,
  }));
};

export const registerCert = async (
  cn: string,
  issuedTo: string,
  expiresAt: string | null,
  fingerprint: string | null,
): Promise<IssuedCert> => {
  const result = await getPool().query(
    `INSERT INTO issued_certs (cn, issued_to, expires_at, fingerprint)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [cn, issuedTo, expiresAt, fingerprint],
  );
  const r = result.rows[0];
  return {
    ...r,
    issued_at: r.issued_at instanceof Date ? r.issued_at.toISOString() : String(r.issued_at),
    expires_at: r.expires_at ? (r.expires_at instanceof Date ? r.expires_at.toISOString() : String(r.expires_at)) : null,
    revoked_at: null,
  };
};

export const revokeCert = async (id: number, reason: string): Promise<IssuedCert | null> => {
  const result = await getPool().query(
    `UPDATE issued_certs
     SET revoked = TRUE, revoked_at = NOW(), revoked_reason = $2
     WHERE id = $1
     RETURNING *`,
    [id, reason],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    ...r,
    issued_at: r.issued_at instanceof Date ? r.issued_at.toISOString() : String(r.issued_at),
    expires_at: r.expires_at ? (r.expires_at instanceof Date ? r.expires_at.toISOString() : String(r.expires_at)) : null,
    revoked_at: r.revoked_at instanceof Date ? r.revoked_at.toISOString() : String(r.revoked_at),
  };
};

export const isFingerprintRevoked = async (fingerprint: string): Promise<boolean> => {
  const result = await getPool().query(
    `SELECT 1 FROM issued_certs WHERE fingerprint = $1 AND revoked = TRUE LIMIT 1`,
    [fingerprint],
  );
  return result.rows.length > 0;
};

/** Task 4 — certificado emitido e activo na CA-CAMPUS. */
export const isFingerprintRegistered = async (fingerprint: string): Promise<boolean> => {
  const result = await getPool().query(
    `SELECT 1 FROM issued_certs WHERE fingerprint = $1 AND revoked = FALSE LIMIT 1`,
    [fingerprint],
  );
  return result.rows.length > 0;
};

export const findCertById = async (id: number): Promise<IssuedCert | null> => {
  const result = await getPool().query(
    `SELECT id, cn, fingerprint, issued_to, issued_at, expires_at,
            revoked, revoked_at, revoked_reason
     FROM issued_certs WHERE id = $1`,
    [id],
  );
  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    ...r,
    issued_at: r.issued_at instanceof Date ? r.issued_at.toISOString() : String(r.issued_at),
    expires_at: r.expires_at ? (r.expires_at instanceof Date ? r.expires_at.toISOString() : String(r.expires_at)) : null,
    revoked_at: r.revoked_at ? (r.revoked_at instanceof Date ? r.revoked_at.toISOString() : String(r.revoked_at)) : null,
  };
};
