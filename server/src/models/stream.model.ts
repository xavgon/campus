import { getPool } from '../database/pool';

export type StreamStatus = 'scheduled' | 'live' | 'ended';

export type StreamMediaType = 'audio' | 'video' | 'both';

export interface StreamRow {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  host_user_id: string | null;
  host_nome: string | null;
  host_email: string | null;
  media_type: StreamMediaType | null;
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
  host_email: string | null;
  media_type: StreamMediaType | null;
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
  host_email: row.host_email,
  media_type: row.media_type,
  scheduled_at: row.scheduled_at?.toISOString() ?? null,
  started_at: row.started_at?.toISOString() ?? null,
  ended_at: row.ended_at?.toISOString() ?? null,
  created_at: row.created_at.toISOString(),
});

const STREAM_SELECT = `
  s.id, s.title, s.description, s.status, s.host_user_id,
  s.media_type,
  u.nome AS host_nome, u.email AS host_email,
  s.scheduled_at, s.started_at, s.ended_at, s.created_at
`;

const STREAM_FROM = 'FROM streams s LEFT JOIN users u ON u.id = s.host_user_id';

export const findStreamById = async (id: string): Promise<StreamRow | null> => {
  const result = await getPool().query(
    `SELECT ${STREAM_SELECT} ${STREAM_FROM} WHERE s.id = $1`,
    [id],
  );
  if (!result.rows[0]) return null;
  return mapStreamRow(result.rows[0]);
};

export const listStreamsForAdmin = async (): Promise<StreamRow[]> => {
  const result = await getPool().query(
    `SELECT ${STREAM_SELECT} ${STREAM_FROM} ORDER BY s.created_at DESC`,
  );
  return result.rows.map(mapStreamRow);
};

export const listLiveStreams = async (): Promise<StreamRow[]> => {
  const result = await getPool().query(
    `SELECT ${STREAM_SELECT} ${STREAM_FROM}
     WHERE s.status = 'live'
     ORDER BY s.started_at DESC NULLS LAST, s.created_at DESC`,
  );
  return result.rows.map(mapStreamRow);
};

export const listScheduledStreamsForHost = async (hostUserId: string): Promise<StreamRow[]> => {
  const result = await getPool().query(
    `SELECT ${STREAM_SELECT} ${STREAM_FROM}
     WHERE s.host_user_id = $1 AND s.status = 'scheduled'
     ORDER BY s.scheduled_at ASC NULLS LAST, s.created_at ASC`,
    [hostUserId],
  );
  return result.rows.map(mapStreamRow);
};

export const findActiveLiveByHostId = async (hostUserId: string): Promise<StreamRow | null> => {
  const result = await getPool().query(
    `SELECT ${STREAM_SELECT} ${STREAM_FROM}
     WHERE s.host_user_id = $1 AND s.status = 'live'
     LIMIT 1`,
    [hostUserId],
  );
  if (!result.rows[0]) return null;
  return mapStreamRow(result.rows[0]);
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
  media_type?: StreamMediaType | null;
  started_at?: Date | null;
}

export interface UpdateStreamInput {
  title?: string;
  description?: string | null;
  status?: StreamStatus;
  host_user_id?: string | null;
  scheduled_at?: string | null;
  media_type?: StreamMediaType | null;
}

export const createStream = async (input: CreateStreamInput): Promise<StreamRow> => {
  const result = await getPool().query(
    `INSERT INTO streams (title, description, status, host_user_id, scheduled_at, media_type, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.title,
      input.description ?? null,
      input.status ?? 'scheduled',
      input.host_user_id ?? null,
      input.scheduled_at ? new Date(input.scheduled_at) : null,
      input.media_type ?? null,
      input.started_at ?? null,
    ],
  );
  const row = await findStreamById(result.rows[0].id);
  if (!row) throw new Error('Falha ao criar transmissão');
  return row;
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
    if (input.status === 'live') {
      fields.push(`started_at = COALESCE(started_at, NOW())`);
    }
    if (input.status === 'ended') {
      fields.push(`ended_at = COALESCE(ended_at, NOW())`);
    }
  }
  if (input.host_user_id !== undefined) {
    fields.push(`host_user_id = $${index++}`);
    values.push(input.host_user_id);
  }
  if (input.scheduled_at !== undefined) {
    fields.push(`scheduled_at = $${index++}`);
    values.push(input.scheduled_at ? new Date(input.scheduled_at) : null);
  }
  if (input.media_type !== undefined) {
    fields.push(`media_type = $${index++}`);
    values.push(input.media_type);
  }

  if (fields.length === 0) return findStreamById(id);

  values.push(id);
  const result = await getPool().query(
    `UPDATE streams SET ${fields.join(', ')} WHERE id = $${index} RETURNING id`,
    values,
  );

  if (!result.rows[0]) return null;
  return findStreamById(id);
};

export const deleteStreamById = async (id: string): Promise<boolean> => {
  const result = await getPool().query('DELETE FROM streams WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
};

/** Marca transmissões «live» órfãs (ex.: após reinício do servidor). */
export const endOrphanedLiveStreams = async (): Promise<number> => {
  const result = await getPool().query(
    `UPDATE streams
     SET status = 'ended', ended_at = COALESCE(ended_at, NOW())
     WHERE status = 'live'`,
  );
  return result.rowCount ?? 0;
};

export interface BeginLiveStreamInput {
  hostUserId: string;
  hostEmail: string;
  title: string;
  mediaType: StreamMediaType;
  streamId?: string;
}

export class LiveStreamConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LiveStreamConflictError';
  }
}

export class LiveStreamNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LiveStreamNotFoundError';
  }
}

/** Cria ou activa uma transmissão na BD (fonte de verdade do liveId). */
export const beginLiveStream = async (input: BeginLiveStreamInput): Promise<StreamRow> => {
  const existingLive = await findActiveLiveByHostId(input.hostUserId);
  if (existingLive && existingLive.id !== input.streamId) {
    throw new LiveStreamConflictError('Já tens uma transmissão activa. Termina-a antes de iniciar outra.');
  }

  if (input.streamId) {
    const scheduled = await findStreamById(input.streamId);
    if (!scheduled || scheduled.status !== 'scheduled') {
      throw new LiveStreamNotFoundError('Transmissão agendada não encontrada ou já não está disponível.');
    }
    if (scheduled.host_user_id && scheduled.host_user_id !== input.hostUserId) {
      throw new LiveStreamNotFoundError('Não és o anfitrião desta transmissão agendada.');
    }

    const updated = await updateStream(input.streamId, {
      title: input.title.trim() || scheduled.title,
      status: 'live',
      host_user_id: input.hostUserId,
      media_type: input.mediaType,
    });
    if (!updated) throw new LiveStreamNotFoundError('Não foi possível iniciar a transmissão agendada.');
    return updated;
  }

  return createStream({
    title: input.title.trim(),
    status: 'live',
    host_user_id: input.hostUserId,
    media_type: input.mediaType,
    started_at: new Date(),
  });
};

export const finishLiveStream = async (id: string): Promise<void> => {
  await updateStream(id, { status: 'ended' });
};
