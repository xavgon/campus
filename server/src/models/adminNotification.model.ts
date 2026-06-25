import { getPool } from '../database/pool';

export type AdminNotificationSeverity = 'info' | 'success' | 'warning';

export interface AdminNotificationRow {
  id: number;
  type: string;
  severity: AdminNotificationSeverity;
  title: string;
  message: string;
  actor_user_id: string | null;
  actor_nome: string | null;
  target_href: string | null;
  read_at: string | null;
  created_at: string;
}

export interface CreateAdminNotificationInput {
  type: string;
  severity?: AdminNotificationSeverity;
  title: string;
  message: string;
  actorUserId?: string | null;
  targetHref?: string | null;
}

const mapRow = (row: {
  id: number;
  type: string;
  severity: AdminNotificationSeverity;
  title: string;
  message: string;
  actor_user_id: string | null;
  actor_nome: string | null;
  target_href: string | null;
  read_at: Date | null;
  created_at: Date;
}): AdminNotificationRow => ({
  id: row.id,
  type: row.type,
  severity: row.severity,
  title: row.title,
  message: row.message,
  actor_user_id: row.actor_user_id,
  actor_nome: row.actor_nome,
  target_href: row.target_href,
  read_at: row.read_at?.toISOString() ?? null,
  created_at: row.created_at.toISOString(),
});

export const insertAdminNotification = async (
  input: CreateAdminNotificationInput,
): Promise<void> => {
  await getPool().query(
    `INSERT INTO admin_notifications (type, severity, title, message, actor_user_id, target_href)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.type,
      input.severity ?? 'info',
      input.title,
      input.message,
      input.actorUserId ?? null,
      input.targetHref ?? null,
    ],
  );
};

export const listAdminNotifications = async (opts?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<AdminNotificationRow[]> => {
  const limit = opts?.limit ?? 30;
  const unreadOnly = opts?.unreadOnly ?? false;
  const where = unreadOnly ? 'WHERE n.read_at IS NULL' : '';

  const result = await getPool().query(
    `SELECT n.id, n.type, n.severity, n.title, n.message,
            n.actor_user_id, u.nome AS actor_nome, n.target_href, n.read_at, n.created_at
     FROM admin_notifications n
     LEFT JOIN users u ON u.id = n.actor_user_id
     ${where}
     ORDER BY n.created_at DESC
     LIMIT $1`,
    [limit],
  );

  return result.rows.map(mapRow);
};

export const countUnreadAdminNotifications = async (): Promise<number> => {
  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM admin_notifications WHERE read_at IS NULL`,
  );
  return Number(result.rows[0]?.count ?? 0);
};

export const markAdminNotificationRead = async (id: number): Promise<boolean> => {
  const result = await getPool().query(
    `UPDATE admin_notifications SET read_at = NOW() WHERE id = $1 AND read_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
};

export const markAllAdminNotificationsRead = async (): Promise<number> => {
  const result = await getPool().query(
    `UPDATE admin_notifications SET read_at = NOW() WHERE read_at IS NULL`,
  );
  return result.rowCount ?? 0;
};
