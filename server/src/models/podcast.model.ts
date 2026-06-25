import { getPool } from '../database/pool';

// ─── Tipos para o utilizador (área autenticada) ───────────────────────────────

export interface Podcast {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  video_url: string | null;
  cover_url: string | null;
  original_size: number | null;
  compressed_size: number | null;
  compression_ratio: number | null;
  processing_time_ms: number | null;
  category_id: number | null;
  category_name: string | null;
  user_id: string;
  author_nome: string;
  author_cert_fingerprint: string | null;
  author_cert_cn: string | null;
  created_at: string;
}

export interface CreatePodcastData {
  title: string;
  description?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  cover_url?: string | null;
  original_size?: number | null;
  category_id?: number | null;
  user_id: string;
  author_cert_fingerprint?: string | null;
  author_cert_cn?: string | null;
}

const podcastSelect = `
  p.id, p.title, p.description,
  p.audio_url, p.video_url, p.cover_url,
  p.original_size, p.compressed_size, p.compression_ratio, p.processing_time_ms,
  p.category_id, c.name AS category_name,
  p.user_id, u.nome AS author_nome,
  p.author_cert_fingerprint, p.author_cert_cn,
  p.created_at
`;

const mapPodcast = (row: Podcast & { created_at: Date }): Podcast => ({
  ...row,
  created_at: row.created_at.toISOString(),
});

// ─── Queries do utilizador ────────────────────────────────────────────────────

export const listPodcasts = async (opts?: {
  search?: string;
  category_id?: number;
}): Promise<Podcast[]> => {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (opts?.search) {
    conditions.push(
      `(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR u.nome ILIKE $${idx})`,
    );
    values.push(`%${opts.search}%`);
    idx++;
  }

  if (opts?.category_id) {
    conditions.push(`p.category_id = $${idx++}`);
    values.push(opts.category_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await getPool().query(
    `SELECT ${podcastSelect}
     FROM podcasts p
     INNER JOIN users u ON u.id = p.user_id
     LEFT JOIN categories c ON c.id = p.category_id
     ${where}
     ORDER BY p.created_at DESC`,
    values,
  );

  return result.rows.map(mapPodcast);
};

export const findPodcastById = async (id: string): Promise<Podcast | null> => {
  const result = await getPool().query(
    `SELECT ${podcastSelect}
     FROM podcasts p
     INNER JOIN users u ON u.id = p.user_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1`,
    [id],
  );

  if (!result.rows[0]) return null;
  return mapPodcast(result.rows[0]);
};

export const insertPodcast = async (data: CreatePodcastData): Promise<Podcast> => {
  const result = await getPool().query(
    `INSERT INTO podcasts (title, description, audio_url, video_url, cover_url, original_size, category_id, user_id, author_cert_fingerprint, author_cert_cn)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      data.title,
      data.description ?? null,
      data.audio_url ?? null,
      data.video_url ?? null,
      data.cover_url ?? null,
      data.original_size ?? null,
      data.category_id ?? null,
      data.user_id,
      data.author_cert_fingerprint ?? null,
      data.author_cert_cn ?? null,
    ],
  );

  const podcast = await findPodcastById(result.rows[0].id as string);
  if (!podcast) throw new Error('Erro ao criar podcast');
  return podcast;
};

export const updatePodcastCompressedMedia = async (
  id: string,
  media: 'audio' | 'video',
  compressedMediaUrl: string,
): Promise<void> => {
  const column = media === 'video' ? 'video_url' : 'audio_url';
  await getPool().query(
    `UPDATE podcasts SET ${column} = $1 WHERE id = $2`,
    [compressedMediaUrl, id],
  );
};

export const finalizePodcastCompression = async (
  id: string,
  compressedSize: number,
  compressionRatio: number,
  processingTimeMs: number,
): Promise<void> => {
  await getPool().query(
    `UPDATE podcasts
     SET compressed_size = $1, compression_ratio = $2, processing_time_ms = $3
     WHERE id = $4`,
    [compressedSize, compressionRatio, processingTimeMs, id],
  );
};

/** @deprecated Usar updatePodcastCompressedMedia + finalizePodcastCompression */
export const updatePodcastCompression = async (
  id: string,
  compressedSize: number,
  compressionRatio: number,
  compressedMediaUrl: string,
  processingTimeMs: number,
  media: 'audio' | 'video' = 'audio',
): Promise<void> => {
  const column = media === 'video' ? 'video_url' : 'audio_url';
  await getPool().query(
    `UPDATE podcasts
     SET compressed_size = $1, compression_ratio = $2, ${column} = $3, processing_time_ms = $4
     WHERE id = $5`,
    [compressedSize, compressionRatio, compressedMediaUrl, processingTimeMs, id],
  );
};

export const deletePodcastAndReturnPath = async (
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<{ audio_url: string | null; video_url: string | null; cover_url: string | null } | null> => {
  const check = await getPool().query(
    'SELECT audio_url, video_url, cover_url, user_id FROM podcasts WHERE id = $1',
    [id],
  );

  const row = check.rows[0] as
    | { audio_url: string | null; video_url: string | null; cover_url: string | null; user_id: string }
    | undefined;

  if (!row) return null;
  if (!isAdmin && row.user_id !== userId) return null;

  await getPool().query('DELETE FROM podcasts WHERE id = $1', [id]);

  return { audio_url: row.audio_url, video_url: row.video_url, cover_url: row.cover_url };
};

export interface PodcastMediaRow {
  id: string;
  audio_url: string | null;
  video_url: string | null;
  cover_url: string | null;
}

export const listPodcastMediaByUserId = async (userId: string): Promise<PodcastMediaRow[]> => {
  const result = await getPool().query<PodcastMediaRow>(
    'SELECT id, audio_url, video_url, cover_url FROM podcasts WHERE user_id = $1',
    [userId],
  );
  return result.rows;
};

export const deletePodcastsByUserId = async (userId: string): Promise<number> => {
  const result = await getPool().query('DELETE FROM podcasts WHERE user_id = $1', [userId]);
  return result.rowCount ?? 0;
};

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
