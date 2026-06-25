import { getPool } from '../database/pool';
import type { UserRole } from '../types/roles';

export interface UserRow {
  id: string;
  nome: string;
  email: string;
  password: string;
  foto_perfil: string | null;
  role: UserRole;
  created_at: Date;
}

export interface PublicUser {
  id: string;
  nome: string;
  email: string;
  foto_perfil: string | null;
  role: UserRole;
  created_at: string;
}

export interface AdminUserListItem {
  id: string;
  nome: string;
  email: string;
  foto_perfil: string | null;
  role: UserRole;
  created_at: string;
}

interface AdminUserListRow extends Omit<AdminUserListItem, 'created_at'> {
  created_at: Date | string;
}

const formatCreatedAt = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : String(value);

const USER_COLUMNS = 'id, nome, email, password, foto_perfil, role, created_at';

const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  foto_perfil: row.foto_perfil
    ? row.foto_perfil.startsWith('/') || row.foto_perfil.startsWith('http')
      ? row.foto_perfil
      : `/${row.foto_perfil}`
    : null,
  role: row.role ?? 'user',
  created_at: row.created_at.toISOString(),
});

export const findUserByEmail = async (email: string): Promise<UserRow | null> => {
  const result = await getPool().query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
    [email.toLowerCase()],
  );
  return result.rows[0] ?? null;
};

export const findUserById = async (id: string): Promise<UserRow | null> => {
  const result = await getPool().query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
};

export const createUser = async (
  nome: string,
  email: string,
  passwordHash: string,
  role: UserRole = 'user',
): Promise<PublicUser> => {
  const result = await getPool().query<UserRow>(
    `INSERT INTO users (nome, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLUMNS}`,
    [nome, email.toLowerCase(), passwordHash, role],
  );
  return toPublicUser(result.rows[0]);
};

export const listUsersForAdmin = async (): Promise<AdminUserListItem[]> => {
  const result = await getPool().query<AdminUserListRow>(
    `SELECT id, nome, email, foto_perfil, role, created_at
     FROM users
     ORDER BY created_at DESC`,
  );
  return result.rows.map((row) => ({
    ...row,
    role: row.role ?? 'user',
    created_at: formatCreatedAt(row.created_at),
  }));
};

export const countUsers = async (): Promise<number> => {
  const result = await getPool().query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users');
  return Number(result.rows[0]?.count ?? 0);
};

export const updateUserByAdmin = async (
  id: string,
  data: { nome?: string; role?: UserRole },
): Promise<AdminUserListItem | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (data.nome !== undefined) {
    fields.push(`nome = $${index++}`);
    values.push(data.nome);
  }
  if (data.role !== undefined) {
    fields.push(`role = $${index++}`);
    values.push(data.role);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await getPool().query<AdminUserListRow>(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${index}
     RETURNING id, nome, email, foto_perfil, role, created_at`,
    values,
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    created_at: formatCreatedAt(row.created_at),
  };
};

export const deleteUserById = async (id: string): Promise<boolean> => {
  const result = await getPool().query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};

export const updateUserProfile = async (
  id: string,
  nome: string,
): Promise<PublicUser | null> => {
  const result = await getPool().query<UserRow>(
    `UPDATE users SET nome = $1 WHERE id = $2 RETURNING ${USER_COLUMNS}`,
    [nome, id],
  );
  if (!result.rows[0]) return null;
  return toPublicUser(result.rows[0]);
};

export const updateUserAvatar = async (
  id: string,
  fotoPerfil: string | null,
): Promise<PublicUser | null> => {
  const result = await getPool().query<UserRow>(
    `UPDATE users SET foto_perfil = $1 WHERE id = $2 RETURNING ${USER_COLUMNS}`,
    [fotoPerfil, id],
  );
  if (!result.rows[0]) return null;
  return toPublicUser(result.rows[0]);
};

export const updateUserPassword = async (
  id: string,
  passwordHash: string,
): Promise<boolean> => {
  const result = await getPool().query(
    'UPDATE users SET password = $1 WHERE id = $2',
    [passwordHash, id],
  );
  return (result.rowCount ?? 0) > 0;
};

/** Promove utilizador normal a criador (idempotente se já for criador). */
export const upgradeUserToCreator = async (id: string): Promise<PublicUser | null> => {
  const result = await getPool().query<UserRow>(
    `UPDATE users SET role = 'creator' WHERE id = $1 AND role = 'user' RETURNING ${USER_COLUMNS}`,
    [id],
  );
  if (result.rows[0]) return toPublicUser(result.rows[0]);

  const existing = await findUserById(id);
  if (!existing) return null;
  if (existing.role === 'creator') return toPublicUser(existing);
  return null;
};

/** Rebaixa criador a utilizador normal (idempotente se já for user). */
export const downgradeCreatorToUser = async (id: string): Promise<PublicUser | null> => {
  const result = await getPool().query<UserRow>(
    `UPDATE users SET role = 'user' WHERE id = $1 AND role = 'creator' RETURNING ${USER_COLUMNS}`,
    [id],
  );
  if (result.rows[0]) return toPublicUser(result.rows[0]);

  const existing = await findUserById(id);
  if (!existing) return null;
  if (existing.role === 'user') return toPublicUser(existing);
  return null;
};

export const mapToPublicUser = toPublicUser;
