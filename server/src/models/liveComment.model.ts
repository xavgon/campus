import { getPool } from '../database/pool';

export interface LiveCommentRow {
  id: string;
  stream_id: string;
  user_id: string;
  author_nome: string;
  author_foto: string | null;
  body: string;
  created_at: string;
}

const mapRow = (row: {
  id: string;
  stream_id: string;
  user_id: string;
  author_nome: string;
  author_foto: string | null;
  body: string;
  created_at: Date;
}): LiveCommentRow => ({
  id: row.id,
  stream_id: row.stream_id,
  user_id: row.user_id,
  author_nome: row.author_nome,
  author_foto: row.author_foto,
  body: row.body,
  created_at: row.created_at.toISOString(),
});

export const insertLiveComment = async (
  streamId: string,
  userId: string,
  body: string,
): Promise<LiveCommentRow> => {
  const result = await getPool().query(
    `INSERT INTO live_comments (stream_id, user_id, body)
     VALUES ($1, $2, $3)
     RETURNING id, stream_id, user_id, body, created_at`,
    [streamId, userId, body],
  );

  const inserted = result.rows[0];
  const author = await getPool().query<{ nome: string; foto_perfil: string | null }>(
    'SELECT nome, foto_perfil FROM users WHERE id = $1',
    [userId],
  );

  return mapRow({
    ...inserted,
    author_nome: author.rows[0]?.nome ?? 'Utilizador',
    author_foto: author.rows[0]?.foto_perfil ?? null,
  });
};

export const listLiveCommentsForStream = async (
  streamId: string,
  limit = 100,
): Promise<LiveCommentRow[]> => {
  const result = await getPool().query(
    `SELECT c.id, c.stream_id, c.user_id, c.body, c.created_at,
            u.nome AS author_nome, u.foto_perfil AS author_foto
     FROM live_comments c
     INNER JOIN users u ON u.id = c.user_id
     WHERE c.stream_id = $1
     ORDER BY c.created_at ASC
     LIMIT $2`,
    [streamId, limit],
  );

  return result.rows.map(mapRow);
};

export const deleteLiveCommentsByStreamId = async (streamId: string): Promise<number> => {
  const result = await getPool().query('DELETE FROM live_comments WHERE stream_id = $1', [streamId]);
  return result.rowCount ?? 0;
};
