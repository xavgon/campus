import { getPool } from '../database/pool';

export type StreamStatus = 'scheduled' | 'live' | 'ended';

export interface StreamRow {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  host_user_id: string | null;
  host_nome: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

const mapStreamRow = (row: {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  host_user_id: string | null;
  host_nome: string | null;
  scheduled_at: Date | null;
  started_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
}): StreamRow => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  host_user_id: row.host_user_id,
  host_nome: row.host_nome,
  scheduled_at: row.scheduled_at?.toISOString() ?? null,
  started_at: row.started_at?.toISOString() ?? null,
  ended_at: row.ended_at?.toISOString() ?? null,
  created_at: row.created_at.toISOString(),
});

export const listStreamsForAdmin = async (): Promise<StreamRow[]> => {
  const result = await getPool().query(
    `SELECT s.id, s.title, s.description, s.status, s.host_user_id,
            u.nome AS host_nome, s.scheduled_at, s.started_at, s.ended_at, s.created_at
     FROM streams s
     LEFT JOIN users u ON u.id = s.host_user_id
     ORDER BY s.created_at DESC`,
  );
  return result.rows.map(mapStreamRow);
};

export const countStreams = async (): Promise<number> => {
  const result = await getPool().query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM streams',
  );
  return Number(result.rows[0]?.count ?? 0);
};

export const countStreamsByStatus = async (status: StreamStatus): Promise<number> => {
  const result = await getPool().query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM streams WHERE status = $1',
    [status],
  );
  return Number(result.rows[0]?.count ?? 0);
};

export interface CreateStreamInput {
  title: string;
  description?: string | null;
  status?: StreamStatus;
  host_user_id?: string | null;
  scheduled_at?: string | null;
}

export interface UpdateStreamInput {
  title?: string;
  description?: string | null;
  status?: StreamStatus;
  host_user_id?: string | null;
  scheduled_at?: string | null;
};

const streamSelect = `
  id, title, description, status, host_user_id,
  (SELECT nome FROM users WHERE id = host_user_id) AS host_nome,
  scheduled_at, started_at, ended_at, created_at
`;

export const createStream = async (input: CreateStreamInput): Promise<StreamRow> => {
  const result = await getPool().query(
    `INSERT INTO streams (title, description, status, host_user_id, scheduled_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${streamSelect}`,
    [
      input.title,
      input.description ?? null,
      input.status ?? 'scheduled',
      input.host_user_id ?? null,
      input.scheduled_at ? new Date(input.scheduled_at) : null,
    ],
  );
  return mapStreamRow(result.rows[0]);
};

export const updateStream = async (
  id: string,
  input: UpdateStreamInput,
): Promise<StreamRow | null> => {
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
  if (input.status !== undefined) {
    fields.push(`status = $${index++}`);
    values.push(input.status);
  }
  if (input.host_user_id !== undefined) {
    fields.push(`host_user_id = $${index++}`);
    values.push(input.host_user_id);
  }
  if (input.scheduled_at !== undefined) {
    fields.push(`scheduled_at = $${index++}`);
    values.push(input.scheduled_at ? new Date(input.scheduled_at) : null);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await getPool().query(
    `UPDATE streams SET ${fields.join(', ')} WHERE id = $${index} RETURNING ${streamSelect}`,
    values,
  );

  if (!result.rows[0]) return null;
  return mapStreamRow(result.rows[0]);
};

export const updateStreamStatus = async (
  id: string,
  status: StreamStatus,
): Promise<StreamRow | null> => updateStream(id, { status });

export const deleteStreamById = async (id: string): Promise<boolean> => {
  const result = await getPool().query('DELETE FROM streams WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};
