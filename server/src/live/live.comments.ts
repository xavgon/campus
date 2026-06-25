import { WebSocket } from 'ws';
import type { LiveCommentRow } from '../models/liveComment.model';
import { insertLiveComment, listLiveCommentsForStream } from '../models/liveComment.model';
import { findUserById } from '../models/user.model';
import {
  LIVE_COMMENT_MAX_LENGTH,
  LIVE_COMMENT_MIN_INTERVAL_MS,
  LIVE_COMMENTS_HISTORY_LIMIT,
} from './live.constants';

export interface LiveCommentWire {
  id: string;
  streamId: string;
  userId: string;
  authorNome: string;
  authorFoto: string | null;
  body: string;
  createdAt: string;
  isHost: boolean;
}

interface CommentParticipant {
  userId: string;
  email: string;
}

interface CommentSession {
  id: string;
  hostId: string;
  broadcaster: WebSocket | null;
  listeners: Set<WebSocket>;
  commentRateByUser: Map<string, number>;
}

const send = (ws: WebSocket, data: object) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

export const toCommentWire = (row: LiveCommentRow, hostId: string): LiveCommentWire => ({
  id: row.id,
  streamId: row.stream_id,
  userId: row.user_id,
  authorNome: row.author_nome,
  authorFoto: row.author_foto,
  body: row.body,
  createdAt: row.created_at,
  isHost: row.user_id === hostId,
});

export const broadcastComment = (session: CommentSession, comment: LiveCommentWire): void => {
  const msg = { type: 'comment', comment };
  if (session.broadcaster?.readyState === WebSocket.OPEN) {
    send(session.broadcaster, msg);
  }
  for (const listener of session.listeners) {
    send(listener, msg);
  }
};

export const sendCommentHistory = async (ws: WebSocket, session: CommentSession): Promise<void> => {
  const rows = await listLiveCommentsForStream(session.id, LIVE_COMMENTS_HISTORY_LIMIT);
  send(ws, {
    type: 'comments_history',
    comments: rows.map((row) => toCommentWire(row, session.hostId)),
  });
};

export const handleLiveComment = async (
  session: CommentSession,
  participant: CommentParticipant,
  ws: WebSocket,
  rawBody: unknown,
): Promise<void> => {
  const body = typeof rawBody === 'string' ? rawBody.trim() : '';
  if (!body) {
    send(ws, { type: 'comment_error', message: 'Escreve algo antes de enviar.' });
    return;
  }
  if (body.length > LIVE_COMMENT_MAX_LENGTH) {
    send(ws, {
      type: 'comment_error',
      message: `Máximo ${LIVE_COMMENT_MAX_LENGTH} caracteres.`,
    });
    return;
  }

  const now = Date.now();
  const lastAt = session.commentRateByUser.get(participant.userId) ?? 0;
  if (now - lastAt < LIVE_COMMENT_MIN_INTERVAL_MS) {
    send(ws, { type: 'comment_error', message: 'Aguarda um momento antes de comentar novamente.' });
    return;
  }
  session.commentRateByUser.set(participant.userId, now);

  const user = await findUserById(participant.userId);
  const row = await insertLiveComment(session.id, participant.userId, body);
  const wire: LiveCommentWire = {
    id: row.id,
    streamId: session.id,
    userId: participant.userId,
    authorNome: user?.nome ?? participant.email,
    authorFoto: user?.foto_perfil ?? null,
    body: row.body,
    createdAt: row.created_at,
    isHost: participant.userId === session.hostId,
  };

  broadcastComment(session, wire);
};

export const createCommentRateMap = (): Map<string, number> => new Map();
