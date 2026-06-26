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
  duration_seconds: number | null;
  media_format: string | null;
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
  duration_seconds?: number | null;
  media_format?: string | null;
  category_id?: number | null;
  user_id: string;
  author_cert_fingerprint?: string | null;
  author_cert_cn?: string | null;
}

const podcastSelect = `
  p.id, p.title, p.description,
  p.audio_url, p.video_url, p.cover_url,
  p.original_size, p.compressed_size, p.compression_ratio, p.processing_time_ms,
  p.duration_seconds, p.media_format,
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

export type PodcastSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export interface PodcastListQuery {
  search?: string;
  category_id?: number;
  page?: number;
  limit?: number;
  sort?: PodcastSort;
}

export interface PodcastListSummary {
  published: number;
  processing: number;
  draft: number;
}

export interface PaginatedPodcasts<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  summary?: PodcastListSummary;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const resolvePagination = (page?: number, limit?: number) => {
  const safePage = Number.isFinite(page) && (page ?? 0) > 0 ? Math.floor(page!) : DEFAULT_PAGE;
  const safeLimit =
    Number.isFinite(limit) && (limit ?? 0) > 0
      ? Math.min(MAX_LIMIT, Math.floor(limit!))
      : DEFAULT_LIMIT;
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
};

const resolveSortClause = (sort?: PodcastSort): string => {
  switch (sort) {
    case 'oldest':
      return 'p.created_at ASC';
    case 'title-asc':
      return 'p.title ASC';
    case 'title-desc':
      return 'p.title DESC';
    case 'newest':
    default:
      return 'p.created_at DESC';
  }
};

const podcastListFrom = `
  FROM podcasts p
  INNER JOIN users u ON u.id = p.user_id
  LEFT JOIN categories c ON c.id = p.category_id
`;

const appendListFilters = (
  conditions: string[],
  values: unknown[],
  idx: { value: number },
  opts?: { search?: string; category_id?: number },
): void => {
  if (opts?.search) {
    conditions.push(
      `(p.title ILIKE $${idx.value} OR p.description ILIKE $${idx.value} OR u.nome ILIKE $${idx.value} OR c.name ILIKE $${idx.value})`,
    );
    values.push(`%${opts.search}%`);
    idx.value += 1;
  }

  if (opts?.category_id) {
    conditions.push(`p.category_id = $${idx.value++}`);
    values.push(opts.category_id);
  }
};

export const listPodcasts = async (
  opts: PodcastListQuery = {},
): Promise<PaginatedPodcasts<Podcast>> => {
  const conditions: string[] = [];
  const values: unknown[] = [];
  const idx = { value: 1 };

  appendListFilters(conditions, values, idx, opts);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { page, limit, offset } = resolvePagination(opts.page, opts.limit);
  const orderBy = resolveSortClause(opts.sort);

  const countResult = await getPool().query<{ total: number }>(
    `SELECT COUNT(*)::int AS total ${podcastListFrom} ${where}`,
    values,
  );
  const total = countResult.rows[0]?.total ?? 0;

  const summaryResult = await getPool().query<PodcastListSummary>(
    `SELECT
       COUNT(*) FILTER (WHERE p.compressed_size IS NOT NULL)::int AS published,
       COUNT(*) FILTER (WHERE p.audio_url IS NOT NULL AND p.compressed_size IS NULL)::int AS processing,
       COUNT(*) FILTER (WHERE p.audio_url IS NULL)::int AS draft
     ${podcastListFrom}
     ${where}`,
    values,
  );

  const limitIdx = values.length + 1;
  const offsetIdx = values.length + 2;
  const listValues = [...values, limit, offset];

  const result = await getPool().query(
    `SELECT ${podcastSelect}
     ${podcastListFrom}
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    listValues,
  );

  return {
    items: result.rows.map(mapPodcast),
    total,
    page,
    limit,
    summary: summaryResult.rows[0] ?? { published: 0, processing: 0, draft: 0 },
  };
};

// ─── Catálogo público (RF09) — episódios prontos, sem dados sensíveis ─────────

export interface PublicPodcast {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
  category_id: number | null;
  category_name: string | null;
  author_nome: string;
  created_at: string;
}

const publicPodcastSelect = `
  p.id, p.title, p.description, p.cover_url,
  p.duration_seconds,
  p.category_id, c.name AS category_name,
  u.nome AS author_nome,
  p.created_at
`;

const mapPublicPodcast = (row: PublicPodcast & { created_at: Date }): PublicPodcast => ({
  ...row,
  created_at: row.created_at.toISOString(),
});

export const listPublicPodcasts = async (
  opts: PodcastListQuery = {},
): Promise<PaginatedPodcasts<PublicPodcast>> => {
  const conditions: string[] = [
    'p.audio_url IS NOT NULL',
    'p.compressed_size IS NOT NULL',
  ];
  const values: unknown[] = [];
  const idx = { value: 1 };

  appendListFilters(conditions, values, idx, opts);

  const where = `WHERE ${conditions.join(' AND ')}`;
  const { page, limit, offset } = resolvePagination(opts.page, opts.limit);
  const orderBy = resolveSortClause(opts.sort);

  const countResult = await getPool().query<{ total: number }>(
    `SELECT COUNT(*)::int AS total ${podcastListFrom} ${where}`,
    values,
  );
  const total = countResult.rows[0]?.total ?? 0;

  const limitIdx = values.length + 1;
  const offsetIdx = values.length + 2;
  const listValues = [...values, limit, offset];

  const result = await getPool().query(
    `SELECT ${publicPodcastSelect}
     ${podcastListFrom}
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    listValues,
  );

  return {
    items: result.rows.map(mapPublicPodcast),
    total,
    page,
    limit,
  };
};

export const findPublicPodcastById = async (id: string): Promise<PublicPodcast | null> => {
  const result = await getPool().query(
    `SELECT ${publicPodcastSelect}
     ${podcastListFrom}
     WHERE p.id = $1
       AND p.audio_url IS NOT NULL
       AND p.compressed_size IS NOT NULL`,
    [id],
  );

  if (!result.rows[0]) return null;
  return mapPublicPodcast(result.rows[0]);
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
    `INSERT INTO podcasts (title, description, audio_url, video_url, cover_url, original_size, duration_seconds, media_format, category_id, user_id, author_cert_fingerprint, author_cert_cn)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id`,
    [
      data.title,
      data.description ?? null,
      data.audio_url ?? null,
      data.video_url ?? null,
      data.cover_url ?? null,
      data.original_size ?? null,
      data.duration_seconds ?? null,
      data.media_format ?? null,
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
  mediaFormat?: string | null,
): Promise<void> => {
  const column = media === 'video' ? 'video_url' : 'audio_url';
  if (media === 'audio' && mediaFormat) {
    await getPool().query(
      `UPDATE podcasts SET ${column} = $1, media_format = $2 WHERE id = $3`,
      [compressedMediaUrl, mediaFormat, id],
    );
    return;
  }
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

/** RF07 — Episódio VOD já comprimido (ex.: gravação live em MP3). */
export const markPodcastStreamReady = async (
  id: string,
  compressedSize: number,
  compressionRatio = 0,
): Promise<void> => {
  await getPool().query(
    `UPDATE podcasts SET compressed_size = $1, compression_ratio = $2 WHERE id = $3`,
    [compressedSize, compressionRatio, id],
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
): Promise<{ audio_url: string | null; video_url: string | null; cover_url: string | null } | null> => {
  const check = await getPool().query(
    'SELECT audio_url, video_url, cover_url, user_id FROM podcasts WHERE id = $1',
    [id],
  );

  const row = check.rows[0] as
    | { audio_url: string | null; video_url: string | null; cover_url: string | null; user_id: string }
    | undefined;

  if (!row) return null;
  if (row.user_id !== userId) return null;

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
  author_cert_fingerprint: string | null;
  author_cert_cn: string | null;
  created_at: string;
}

export const listPodcastsForAdmin = async (): Promise<AdminPodcastListItem[]> => {
  const result = await getPool().query<
    AdminPodcastListItem & { created_at: Date }
  >(
    `SELECT p.id, p.title, p.description, p.category_id, c.name AS category_name,
            p.user_id, u.nome AS author_nome, u.email AS author_email,
            p.author_cert_fingerprint, p.author_cert_cn, p.created_at
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
  p.user_id, u.nome AS author_nome, u.email AS author_email,
  p.author_cert_fingerprint, p.author_cert_cn, p.created_at
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
