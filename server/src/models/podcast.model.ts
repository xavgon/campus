import { getPool } from '../database/pool';

export interface AdminPodcastListItem {
  id: string;
  title: string;
  description: string | null;
  category_id: number | null;
  category_name: string | null;
  user_id: string;
  author_nome: string;
  author_email: string;
  created_at: string;
}

export const listPodcastsForAdmin = async (): Promise<AdminPodcastListItem[]> => {
  const result = await getPool().query<
    AdminPodcastListItem & { created_at: Date }
  >(
    `SELECT p.id, p.title, p.description, p.category_id, c.name AS category_name,
            p.user_id, u.nome AS author_nome, u.email AS author_email, p.created_at
     FROM podcasts p
     INNER JOIN users u ON u.id = p.user_id
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC`,
  );

  return result.rows.map((row) => ({
    ...row,
    created_at: row.created_at.toISOString(),
  }));
};

export const countPodcasts = async (): Promise<number> => {
  const result = await getPool().query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM podcasts',
  );
  return Number(result.rows[0]?.count ?? 0);
};

export interface CreatePodcastInput {
  title: string;
  description?: string | null;
  category_id?: number | null;
  user_id: string;
}

export interface UpdatePodcastInput {
  title?: string;
  description?: string | null;
  category_id?: number | null;
}

const podcastAdminSelect = `
  p.id, p.title, p.description, p.category_id, c.name AS category_name,
  p.user_id, u.nome AS author_nome, u.email AS author_email, p.created_at
`;

const mapAdminPodcast = (row: AdminPodcastListItem & { created_at: Date }): AdminPodcastListItem => ({
  ...row,
  created_at: row.created_at.toISOString(),
});

export const createPodcast = async (input: CreatePodcastInput): Promise<AdminPodcastListItem> => {
  const result = await getPool().query(
    `INSERT INTO podcasts (title, description, category_id, user_id)
     VALUES ($1, $2, $3, $4)
     RETURNING ${podcastAdminSelect}`,
    [input.title, input.description ?? null, input.category_id ?? null, input.user_id],
  );
  return mapAdminPodcast(result.rows[0]);
};

export const updatePodcastById = async (
  id: string,
  input: UpdatePodcastInput,
): Promise<AdminPodcastListItem | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (input.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(input.title);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(input.description);
  }
  if (input.category_id !== undefined) {
    fields.push(`category_id = $${index++}`);
    values.push(input.category_id);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const updated = await getPool().query(
    `UPDATE podcasts SET ${fields.join(', ')} WHERE id = $${index} RETURNING id`,
    values,
  );

  if (!updated.rows[0]) return null;

  const fetched = await getPool().query(
    `SELECT ${podcastAdminSelect}
     FROM podcasts p
     INNER JOIN users u ON u.id = p.user_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [id],
  );

  if (!fetched.rows[0]) return null;
  return mapAdminPodcast(fetched.rows[0]);
};

export const deletePodcastById = async (id: string): Promise<boolean> => {
  const result = await getPool().query('DELETE FROM podcasts WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};
