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
  role: UserRole;
  created_at: string;
}

const USER_COLUMNS = 'id, nome, email, password, foto_perfil, role, created_at';

const toPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  foto_perfil: row.foto_perfil,
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
  const result = await getPool().query<AdminUserListItem>(
    `SELECT id, nome, email, role, created_at
     FROM users
     ORDER BY created_at DESC`,
  );
  return result.rows.map((row) => ({
    ...row,
    role: row.role ?? 'user',
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
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
  const result = await getPool().query<AdminUserListItem>(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${index}
     RETURNING id, nome, email, role, created_at`,
    values,
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
};

export const deleteUserById = async (id: string): Promise<boolean> => {
  const result = await getPool().query('DELETE FROM users WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};

export const mapToPublicUser = toPublicUser;
