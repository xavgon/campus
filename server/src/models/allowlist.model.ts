import { getPool } from '../database/pool';

export interface AllowlistRow {
  ip: string;
  reason: string;
  added_at: string;
  added_by: string | null;
}

export const listAllowlistRows = async (): Promise<AllowlistRow[]> => {
  const result = await getPool().query<AllowlistRow & { added_at: Date }>(
    `SELECT ip, reason, added_by, added_at
     FROM mtls_allowlist
     ORDER BY added_at DESC`,
  );

  return result.rows.map((row) => ({
    ...row,
    added_at: row.added_at.toISOString(),
  }));
};

export const upsertAllowlistRow = async (
  ip: string,
  reason: string,
  addedBy: string | null = null,
): Promise<AllowlistRow> => {
  const result = await getPool().query<AllowlistRow & { added_at: Date }>(
    `INSERT INTO mtls_allowlist (ip, reason, added_by)
     VALUES ($1, $2, $3)
     ON CONFLICT (ip) DO UPDATE
       SET reason = EXCLUDED.reason,
           added_by = COALESCE(EXCLUDED.added_by, mtls_allowlist.added_by),
           added_at = NOW()
     RETURNING ip, reason, added_by, added_at`,
    [ip, reason, addedBy],
  );

  const row = result.rows[0];
  return {
    ...row,
    added_at: row.added_at.toISOString(),
  };
};

export const deleteAllowlistRow = async (ip: string): Promise<boolean> => {
  const result = await getPool().query('DELETE FROM mtls_allowlist WHERE ip = $1', [ip]);
  return (result.rowCount ?? 0) > 0;
};
