import http from 'http';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { WebSocket, WebSocketServer } from 'ws';
import { config } from '../config';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MediaType = 'audio' | 'video' | 'both';

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
  broadcaster: WebSocket;
  listeners: Set<WebSocket>;
  startedAt: Date;
}

// ─── Estado em memória ────────────────────────────────────────────────────────

const sessions = new Map<string, LiveSession>();

// ─── Helpers públicos (para REST) ─────────────────────────────────────────────

export const getActiveSessions = () =>
  Array.from(sessions.values()).map((s) => ({
    id: s.id,
    title: s.title,
    mediaType: s.mediaType,
    hostEmail: s.hostEmail,
    listenersCount: s.listeners.size,
    startedAt: s.startedAt.toISOString(),
  }));

// ─── Helpers internos ─────────────────────────────────────────────────────────

const send = (ws: WebSocket, data: object) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

const broadcast = (session: LiveSession, data: Buffer | Uint8Array) => {
  for (const listener of session.listeners) {
    if (listener.readyState === WebSocket.OPEN) {
      listener.send(data);
    }
  }
};

const notifyBroadcaster = (session: LiveSession) => {
  send(session.broadcaster, {
    type: 'stats',
    listenersCount: session.listeners.size,
  });
};

const parseToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
};

// ─── Gateway principal ────────────────────────────────────────────────────────

export const attachLiveGateway = (server: http.Server): void => {
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') ?? '';
    const role = url.searchParams.get('role'); // 'broadcaster' | 'listener'
    const liveId = url.searchParams.get('liveId') ?? '';

    const payload = parseToken(token);
    if (!payload) {
      send(ws, { type: 'error', message: 'Token inválido' });
      ws.close(1008, 'Unauthorized');
      return;
    }

    if (role === 'broadcaster') {
      handleBroadcaster(ws, payload);
    } else if (role === 'listener') {
      handleListener(ws, payload, liveId);
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
    // Mensagens binárias = chunks de áudio/vídeo
    if (isBinary) {
      if (!session) return;
      broadcast(session, raw as Buffer);
      return;
    }

    // Mensagens de texto = comandos JSON
    try {
      const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

      if (msg.type === 'start') {
        const title = typeof msg.title === 'string' ? msg.title : 'Live sem título';
        const mediaType = (msg.mediaType as MediaType) ?? 'audio';

        session = {
          id: randomUUID(),
          title,
          mediaType,
          hostId: payload.userId,
          hostEmail: payload.email,
          broadcaster: ws,
          listeners: new Set(),
          startedAt: new Date(),
        };
        sessions.set(session.id, session);

        send(ws, { type: 'started', liveId: session.id, title, mediaType });
        console.info(`[LIVE] "${title}" iniciada por ${payload.email} — ID: ${session.id}`);
      }

      if (msg.type === 'stop' && session) {
        endSession(session);
        session = null;
      }
    } catch {
      // ignora mensagens mal formadas
    }
  });

  ws.on('close', () => {
    if (session) {
      endSession(session);
      session = null;
    }
  });
};

// ─── Listener ─────────────────────────────────────────────────────────────────

const handleListener = (ws: WebSocket, payload: JwtPayload, liveId: string) => {
  const session = sessions.get(liveId);

  if (!session) {
    send(ws, { type: 'error', message: 'Live não encontrada ou já terminou.' });
    ws.close(1008, 'Live not found');
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
  });

  console.info(`[LIVE] ${payload.email} entrou na live "${session.title}"`);

  ws.on('close', () => {
    session.listeners.delete(ws);
    if (session.broadcaster.readyState === WebSocket.OPEN) {
      notifyBroadcaster(session);
    }
    console.info(`[LIVE] ${payload.email} saiu da live "${session.title}"`);
  });
};

// ─── Terminar sessão ──────────────────────────────────────────────────────────

const endSession = (session: LiveSession) => {
  for (const listener of session.listeners) {
    send(listener, { type: 'ended', message: 'A transmissão terminou.' });
    listener.close();
  }
  sessions.delete(session.id);
  console.info(`[LIVE] "${session.title}" terminou.`);
};
