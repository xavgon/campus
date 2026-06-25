import http from 'http';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import { config } from '../config';
import {
  beginLiveStream,
  endOrphanedLiveStreams,
  finishLiveStream,
  findStreamById,
  listLiveStreams,
  LiveStreamConflictError,
  LiveStreamNotFoundError,
  type StreamMediaType,
} from '../models/stream.model';
import {
  LIVE_BROADCASTER_RECONNECT_MS,
  LIVE_LISTENER_BUFFER_AUDIO,
  LIVE_LISTENER_BUFFER_VIDEO,
  LIVE_TYPE_AUDIO,
} from './live.constants';
import { LiveRecorder } from './live.recorder';
import {
  createCommentRateMap,
  handleLiveComment,
  sendCommentHistory,
} from './live.comments';
import { notifyLiveEnded, notifyLiveStarted } from '../services/adminNotification.service';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MediaType = StreamMediaType;

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface LiveSession {
  id: string;
  title: string;
  mediaType: MediaType;
  hostId: string;
  hostEmail: string;
  broadcaster: WebSocket | null;
  listeners: Set<WebSocket>;
  startedAt: Date;
  recorder: LiveRecorder;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  commentRateByUser: Map<string, number>;
}

export interface StreamRuntimeStats {
  listenersCount: number;
  broadcasterConnected: boolean;
  awaitingReconnect: boolean;
}

// ─── Estado em memória (ligações WS — metadados na BD) ───────────────────────

const sessions = new Map<string, LiveSession>();

// ─── Helpers públicos (para REST) ─────────────────────────────────────────────

export const getStreamRuntimeStats = (): Record<string, StreamRuntimeStats> => {
  const stats: Record<string, StreamRuntimeStats> = {};
  for (const [id, session] of sessions) {
    const broadcasterConnected = session.broadcaster?.readyState === WebSocket.OPEN;
    stats[id] = {
      listenersCount: session.listeners.size,
      broadcasterConnected,
      awaitingReconnect: !broadcasterConnected && session.reconnectTimer != null,
    };
  }
  return stats;
};

export const getActiveSessions = async () => {
  const rows = await listLiveStreams();

  return rows
    .filter((row) => sessions.has(row.id))
    .map((row) => {
      const memory = sessions.get(row.id)!;
      const broadcasterConnected = memory.broadcaster?.readyState === WebSocket.OPEN;
      return {
        id: row.id,
        title: row.title,
        mediaType: (row.media_type ?? memory.mediaType ?? 'audio') as MediaType,
        hostEmail: row.host_email ?? memory.hostEmail,
        hostNome: row.host_nome,
        listenersCount: memory.listeners.size,
        startedAt: row.started_at ?? memory.startedAt.toISOString(),
        status: row.status,
        awaitingReconnect: !broadcasterConnected && memory.reconnectTimer != null,
      };
    });
};

// ─── Helpers internos ─────────────────────────────────────────────────────────

const send = (ws: WebSocket, data: object) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

const broadcast = (session: LiveSession, data: Buffer | Uint8Array) => {
  const isAudio = data[0] === LIVE_TYPE_AUDIO;
  const limit = isAudio ? LIVE_LISTENER_BUFFER_AUDIO : LIVE_LISTENER_BUFFER_VIDEO;

  for (const listener of session.listeners) {
    if (listener.readyState !== WebSocket.OPEN) continue;
    if (listener.bufferedAmount > limit) continue;
    listener.send(data);
  }
};

const notifyBroadcaster = (session: LiveSession) => {
  if (!session.broadcaster || session.broadcaster.readyState !== WebSocket.OPEN) return;
  send(session.broadcaster, {
    type: 'stats',
    listenersCount: session.listeners.size,
  });
};

const notifyListenersHostReconnecting = (session: LiveSession) => {
  for (const listener of session.listeners) {
    send(listener, {
      type: 'host_reconnecting',
      message: 'O anfitrião perdeu a ligação. A aguardar reconexão…',
    });
  }
};

const notifyListenersHostBack = (session: LiveSession) => {
  for (const listener of session.listeners) {
    send(listener, { type: 'host_back', message: 'O anfitrião voltou. A transmissão continua.' });
  }
};

const clearReconnectTimer = (session: LiveSession) => {
  if (session.reconnectTimer) {
    clearTimeout(session.reconnectTimer);
    session.reconnectTimer = null;
  }
};

const scheduleReconnectEnd = (session: LiveSession) => {
  clearReconnectTimer(session);
  session.reconnectTimer = setTimeout(() => {
    void endSession(session);
  }, LIVE_BROADCASTER_RECONNECT_MS);
};

const parseToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
};

const canBroadcast = (role: string) => role === 'creator' || role === 'admin';

const processParticipantMessage = async (
  session: LiveSession,
  payload: JwtPayload,
  ws: WebSocket,
  msg: Record<string, unknown>,
): Promise<void> => {
  if (msg.type === 'comment') {
    await handleLiveComment(
      session,
      { userId: payload.userId, email: payload.email },
      ws,
      msg.body,
    );
  }
};

const attachBroadcaster = (session: LiveSession, ws: WebSocket) => {
  clearReconnectTimer(session);
  session.broadcaster = ws;
  send(ws, {
    type: 'started',
    liveId: session.id,
    title: session.title,
    mediaType: session.mediaType,
    resumed: true,
  });
  notifyBroadcaster(session);
  notifyListenersHostBack(session);
  void sendCommentHistory(ws, session);
};

const resumeLiveSession = async (
  ws: WebSocket,
  payload: JwtPayload,
  liveId: string,
): Promise<LiveSession | { error: string }> => {
  const streamRow = await findStreamById(liveId);
  if (!streamRow || streamRow.status !== 'live') {
    return { error: 'Esta transmissão já não está activa.' };
  }
  if (streamRow.host_user_id && streamRow.host_user_id !== payload.userId) {
    return { error: 'Não és o anfitrião desta transmissão.' };
  }

  const existing = sessions.get(liveId);
  if (existing) {
    if (existing.broadcaster?.readyState === WebSocket.OPEN) {
      return { error: 'Esta transmissão já está activa noutro dispositivo ou separador.' };
    }
    attachBroadcaster(existing, ws);
    console.info(`[LIVE] "${existing.title}" retomada por ${payload.email}`);
    return existing;
  }

  const mediaType = (streamRow.media_type ?? 'audio') as MediaType;
  const session: LiveSession = {
    id: streamRow.id,
    title: streamRow.title,
    mediaType,
    hostId: payload.userId,
    hostEmail: payload.email,
    broadcaster: ws,
    listeners: new Set(),
    startedAt: new Date(streamRow.started_at ?? Date.now()),
    recorder: new LiveRecorder(streamRow.id, streamRow.title, mediaType),
    reconnectTimer: null,
    commentRateByUser: createCommentRateMap(),
  };
  sessions.set(session.id, session);
  send(ws, {
    type: 'started',
    liveId: session.id,
    title: session.title,
    mediaType: session.mediaType,
    resumed: true,
  });
  void sendCommentHistory(ws, session);
  console.info(`[LIVE] "${session.title}" retomada (sessão WS recriada) por ${payload.email}`);
  return session;
};

// ─── Gateway principal ────────────────────────────────────────────────────────

export const attachLiveGateway = (server: http.Server): void => {
  void endOrphanedLiveStreams().then((count) => {
    if (count > 0) {
      console.info(`[LIVE] ${count} transmissão(ões) órfã(s) marcadas como terminadas.`);
    }
  });

  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') ?? '';
    const role = url.searchParams.get('role');
    const liveId = url.searchParams.get('liveId') ?? '';

    const payload = parseToken(token);
    if (!payload) {
      send(ws, { type: 'error', message: 'Token inválido' });
      ws.close(1008, 'Unauthorized');
      return;
    }

    if (role === 'broadcaster') {
      if (!canBroadcast(payload.role)) {
        send(ws, { type: 'error', message: 'Apenas criadores podem transmitir.' });
        ws.close(1008, 'Forbidden');
        return;
      }
      handleBroadcaster(ws, payload);
    } else if (role === 'listener') {
      void handleListener(ws, payload, liveId);
    } else {
      send(ws, { type: 'error', message: 'Role inválido. Use broadcaster ou listener.' });
      ws.close(1008, 'Bad role');
    }
  });

  console.log('[CAMPUS] WebSocket live gateway activo em ws://localhost:' + config.port + '/live');
};

// ─── Broadcaster ──────────────────────────────────────────────────────────────

const handleBroadcaster = (ws: WebSocket, payload: JwtPayload) => {
  let session: LiveSession | null = null;

  ws.on('message', (raw, isBinary) => {
    if (isBinary) {
      if (!session) return;
      const buf = raw as Buffer;
      broadcast(session, buf);

      const type = buf[0];
      const chunk = buf.slice(1);
      if (type === 0x01) session.recorder.writeVideo(chunk);
      if (type === 0x02) session.recorder.writeAudio(chunk);
      return;
    }

    void (async () => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

        if (msg.type === 'resume') {
          if (session) return;

          const liveId = typeof msg.liveId === 'string' ? msg.liveId : '';
          if (!liveId) {
            send(ws, { type: 'error', message: 'ID da transmissão em falta para retomar.' });
            return;
          }

          const result = await resumeLiveSession(ws, payload, liveId);
          if ('error' in result) {
            send(ws, { type: 'error', message: result.error });
            return;
          }
          session = result;
          return;
        }

        if (msg.type === 'start') {
          if (session) return;

          const resumeId = typeof msg.liveId === 'string' ? msg.liveId : undefined;
          if (resumeId) {
            const result = await resumeLiveSession(ws, payload, resumeId);
            if ('error' in result) {
              send(ws, { type: 'error', message: result.error });
              return;
            }
            session = result;
            return;
          }

          const title = typeof msg.title === 'string' ? msg.title : 'Live sem título';
          const mediaType = (msg.mediaType as MediaType) ?? 'audio';
          const streamId = typeof msg.streamId === 'string' ? msg.streamId : undefined;

          let streamRow;
          try {
            streamRow = await beginLiveStream({
              hostUserId: payload.userId,
              hostEmail: payload.email,
              title,
              mediaType,
              streamId,
            });
          } catch (err) {
            if (err instanceof LiveStreamConflictError || err instanceof LiveStreamNotFoundError) {
              send(ws, { type: 'error', message: err.message });
              return;
            }
            console.error('[LIVE] Erro ao criar transmissão na BD:', err);
            send(ws, { type: 'error', message: 'Não foi possível registar a transmissão.' });
            return;
          }

          session = {
            id: streamRow.id,
            title: streamRow.title,
            mediaType,
            hostId: payload.userId,
            hostEmail: payload.email,
            broadcaster: ws,
            listeners: new Set(),
            startedAt: new Date(streamRow.started_at ?? Date.now()),
            recorder: new LiveRecorder(streamRow.id, streamRow.title, mediaType),
            reconnectTimer: null,
            commentRateByUser: createCommentRateMap(),
          };
          sessions.set(session.id, session);

          send(ws, {
            type: 'started',
            liveId: session.id,
            title: session.title,
            mediaType: session.mediaType,
          });
          void sendCommentHistory(ws, session);
          void notifyLiveStarted({
            streamId: streamRow.id,
            title: streamRow.title,
            hostUserId: payload.userId,
            hostLabel: payload.email,
          });
          console.info(`[LIVE] "${session.title}" iniciada por ${payload.email} — ID: ${session.id}`);
        }

        if (msg.type === 'stop' && session) {
          await endSession(session);
          session = null;
          return;
        }

        if (session) {
          await processParticipantMessage(session, payload, ws, msg);
        }
      } catch {
        // ignora mensagens mal formadas
      }
    })();
  });

  ws.on('close', () => {
    if (!session) return;

    const active = session;
    active.broadcaster = null;
    notifyListenersHostReconnecting(active);
    scheduleReconnectEnd(active);
    session = null;
  });
};

// ─── Listener ─────────────────────────────────────────────────────────────────

const handleListener = async (ws: WebSocket, payload: JwtPayload, liveId: string) => {
  if (!liveId) {
    send(ws, { type: 'error', message: 'ID da transmissão em falta.' });
    ws.close(1008, 'Missing liveId');
    return;
  }

  const streamRow = await findStreamById(liveId);
  if (!streamRow || streamRow.status !== 'live') {
    send(ws, { type: 'error', message: 'Esta transmissão já não está activa.' });
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) ws.close(1008, 'Live not active');
    }, 100);
    return;
  }

  const session = sessions.get(liveId);
  if (!session) {
    send(ws, {
      type: 'error',
      message: 'Transmissão indisponível momentaneamente. O anfitrião pode estar a reconectar.',
      retryable: true,
    });
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) ws.close(1008, 'Live offline');
    }, 100);
    return;
  }

  const broadcasterReady = session.broadcaster?.readyState === WebSocket.OPEN;
  if (!broadcasterReady && !session.reconnectTimer) {
    send(ws, {
      type: 'error',
      message: 'Transmissão indisponível momentaneamente. O anfitrião pode estar a reconectar.',
      retryable: true,
    });
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) ws.close(1008, 'Live offline');
    }, 100);
    return;
  }

  session.listeners.add(ws);
  notifyBroadcaster(session);

  send(ws, {
    type: 'joined',
    liveId: session.id,
    title: session.title,
    mediaType: session.mediaType,
    hostEmail: session.hostEmail,
    startedAt: session.startedAt.toISOString(),
    awaitingHost: !broadcasterReady,
  });
  void sendCommentHistory(ws, session);

  console.info(`[LIVE] ${payload.email} entrou na live "${session.title}"`);

  ws.on('message', (raw, isBinary) => {
    if (isBinary) return;
    void (async () => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        await processParticipantMessage(session, payload, ws, msg);
      } catch {
        // ignora mensagens mal formadas
      }
    })();
  });

  ws.on('close', () => {
    session.listeners.delete(ws);
    notifyBroadcaster(session);
    console.info(`[LIVE] ${payload.email} saiu da live "${session.title}"`);
  });
};

// ─── Terminar sessão ──────────────────────────────────────────────────────────

const endSession = async (session: LiveSession) => {
  clearReconnectTimer(session);

  for (const listener of session.listeners) {
    send(listener, { type: 'ended', message: 'A transmissão terminou.' });
    listener.close();
  }
  sessions.delete(session.id);

  try {
    await finishLiveStream(session.id);
  } catch (err) {
    console.error(`[LIVE] Erro ao actualizar BD para ${session.id}:`, err);
  }

  void notifyLiveEnded({
    streamId: session.id,
    title: session.title,
    hostUserId: session.hostId,
    hostLabel: session.hostEmail,
  });

  console.info(`[LIVE] "${session.title}" terminou.`);
  void session.recorder.stop();

  if (session.broadcaster?.readyState === WebSocket.OPEN) {
    send(session.broadcaster, { type: 'ended', message: 'A transmissão terminou.' });
    session.broadcaster.close();
  }
};

/** Termina transmissões activas de um anfitrião (ex.: ao deixar de ser criador). */
export const endSessionsByHost = async (hostUserId: string): Promise<void> => {
  const toEnd = [...sessions.values()].filter((session) => session.hostId === hostUserId);
  for (const session of toEnd) {
    if (session.broadcaster?.readyState === WebSocket.OPEN) {
      send(session.broadcaster, {
        type: 'ended',
        message: 'A transmissão terminou porque a conta de criador foi encerrada.',
      });
    }
    await endSession(session);
  }
};
