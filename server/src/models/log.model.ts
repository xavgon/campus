import { getPool } from '../database/pool';

export interface AdminLogRow {
  id: number;
  user_id: string | null;
  user_nome: string | null;
  action: string;
  created_at: string;
}

export const insertLog = async (userId: string | null, action: string): Promise<void> => {
  await getPool().query('INSERT INTO logs (user_id, action) VALUES ($1, $2)', [userId, action]);
};

export const listLogsForAdmin = async (limit = 100): Promise<AdminLogRow[]> => {
  const result = await getPool().query(
    `SELECT l.id, l.user_id, u.nome AS user_nome, l.action, l.created_at
     FROM logs l
     LEFT JOIN users u ON u.id = l.user_id
     ORDER BY l.created_at DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    user_nome: row.user_nome,
    action: row.action,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }));
};
