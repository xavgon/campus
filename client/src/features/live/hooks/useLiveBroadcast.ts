import { useCallback, useEffect, useRef, useState } from 'react';
import { LIVE_TYPE_AUDIO, LIVE_WS_MAX_BUFFER, LIVE_WS_MAX_BUFFER_VIDEO } from '@/features/live/constants';
import { buildLiveWebSocketUrl } from '@/features/live/services/live.service';
import type { LiveComment, LiveMediaType } from '@/features/live/types/live.types';
import { applyLiveCommentWsMessage, mergeLiveComments } from '@/features/live/utils/liveComments';
import { LIVE_COPY } from '@/shared/copy/campusMessages';
import {
  startLiveCapture,
  type LiveCaptureHandles,
  type LiveRecordingResult,
} from '@/features/live/utils/liveMedia';

export type BroadcastPhase = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'ended' | 'error';

const connectBroadcasterWs = (
  url: string,
  payload: { type: 'start'; title: string; mediaType: LiveMediaType; streamId?: string } | { type: 'resume'; liveId: string },
  handlers: {
    onStarted: (liveId: string, resumed: boolean) => void;
    onStats: (count: number) => void;
    onError: (message: string) => void;
    onEnded: () => void;
    onUnexpectedClose: () => void;
    onCommentMessage: (msg: {
      type: string;
      comment?: unknown;
      comments?: unknown[];
      message?: string;
    }) => void;
    isStale: () => boolean;
  },
): WebSocket => {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    if (handlers.isStale()) return;
    ws.send(JSON.stringify(payload));
  };

  ws.onmessage = (event) => {
    if (handlers.isStale()) return;
    try {
      const msg = JSON.parse(String(event.data)) as {
        type: string;
        liveId?: string;
        message?: string;
        listenersCount?: number;
        resumed?: boolean;
        comment?: unknown;
        comments?: unknown[];
      };

      if (msg.type === 'started' && msg.liveId) {
        handlers.onStarted(msg.liveId, msg.resumed === true);
      }

      if (msg.type === 'stats' && typeof msg.listenersCount === 'number') {
        handlers.onStats(msg.listenersCount);
      }

      if (msg.type === 'error') {
        handlers.onError(msg.message ?? 'Erro na transmissão.');
      }

      if (msg.type === 'ended') {
        handlers.onEnded();
      }

      handlers.onCommentMessage(msg);
    } catch {
      // ignore malformed
    }
  };

  ws.onerror = () => {
    if (handlers.isStale()) return;
    handlers.onError(LIVE_COPY.broadcastConnectFailed);
  };

  ws.onclose = () => {
    if (handlers.isStale()) return;
    handlers.onUnexpectedClose();
  };

  return ws;
};

export const useLiveBroadcast = () => {
  const [phase, setPhase] = useState<BroadcastPhase>('idle');
  const [liveId, setLiveId] = useState<string | null>(null);
  const [listenersCount, setListenersCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<LiveRecordingResult | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMediaType, setBroadcastMediaType] = useState<LiveMediaType>('audio');
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const captureRef = useRef<LiveCaptureHandles | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const wsGenerationRef = useRef(0);
  const intentionalStopRef = useRef(false);
  const liveIdRef = useRef<string | null>(null);

  const finalizeCapture = useCallback(async () => {
    const handles = captureRef.current;
    captureRef.current = null;
    if (!handles) return null;
    try {
      return await handles.stop();
    } catch {
      return null;
    }
  }, []);

  const closeWs = useCallback((sendStop: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (sendStop) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'stop' }));
        } catch {
          // ignore
        }
      }
      wsRef.current.close();
    }
    wsRef.current = null;
    wsGenerationRef.current += 1;
  }, []);

  const cleanup = useCallback(
    async (collectRecording: boolean) => {
      intentionalStopRef.current = true;
      let result: LiveRecordingResult | null = null;
      if (collectRecording) {
        result = await finalizeCapture();
      } else {
        await finalizeCapture();
      }
      closeWs(true);
      return result;
    },
    [closeWs, finalizeCapture],
  );

  useEffect(
    () => () => {
      void cleanup(false);
    },
    [cleanup],
  );

  const beginCaptureIfNeeded = useCallback(
    async (mediaType: LiveMediaType, ws: WebSocket) => {
      if (captureRef.current) return;
      try {
        const handles = await startLiveCapture(mediaType, previewRef.current, (chunk) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const isAudio = chunk[0] === LIVE_TYPE_AUDIO;
          const limit = isAudio ? LIVE_WS_MAX_BUFFER : LIVE_WS_MAX_BUFFER_VIDEO;
          if (ws.bufferedAmount > limit) return;
          ws.send(new Uint8Array(chunk));
        });
        captureRef.current = handles;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : LIVE_COPY.mediaPermissionFailed);
        setPhase('error');
        closeWs(true);
      }
    },
    [closeWs],
  );

  const attachWs = useCallback(
    (
      payload:
        | { type: 'start'; title: string; mediaType: LiveMediaType; streamId?: string }
        | { type: 'resume'; liveId: string },
      mediaType: LiveMediaType,
      options?: { keepStartedAt?: boolean },
    ) => {
      const url = buildLiveWebSocketUrl({ role: 'broadcaster' });
      if (!url) {
        setError(LIVE_COPY.sessionExpired);
        setPhase('error');
        return;
      }

      intentionalStopRef.current = false;
      const generation = ++wsGenerationRef.current;
      const isStale = () => generation !== wsGenerationRef.current;

      const ws = connectBroadcasterWs(url, payload, {
        isStale,
        onStarted: (id, resumed) => {
          liveIdRef.current = id;
          setLiveId(id);
          setPhase('live');
          if (!options?.keepStartedAt && !resumed) {
            setStartedAtMs(Date.now());
          }
          void beginCaptureIfNeeded(mediaType, ws);
        },
        onStats: (count) => setListenersCount(count),
        onError: (message) => {
          setError(message);
          setPhase('error');
          void finalizeCapture();
          closeWs(false);
        },
        onEnded: () => {
          setPhase('ended');
          closeWs(false);
        },
        onUnexpectedClose: () => {
          if (intentionalStopRef.current) return;
          const currentId = liveIdRef.current;
          if (!currentId || !captureRef.current) {
            setPhase((prev) => (prev === 'error' ? 'error' : prev));
            return;
          }
          setPhase('reconnecting');
          setError(null);
          window.setTimeout(() => {
            if (isStale() || intentionalStopRef.current) return;
            attachWs({ type: 'resume', liveId: currentId }, mediaType, { keepStartedAt: true });
          }, 1500);
        },
        onCommentMessage: (msg) => {
          applyLiveCommentWsMessage(msg, {
            onHistory: (items) => setComments(items),
            onComment: (comment) => setComments((prev) => mergeLiveComments(prev, [comment])),
            onError: (message) => setCommentError(message),
          });
        },
      });

      wsRef.current = ws;
    },
    [beginCaptureIfNeeded, closeWs, finalizeCapture],
  );

  const start = useCallback(
    async (title: string, mediaType: LiveMediaType, streamId?: string) => {
      setError(null);
      setRecording(null);
      setPhase('connecting');
      setListenersCount(0);
      setLiveId(null);
      liveIdRef.current = null;
      setBroadcastTitle(title.trim());
      setBroadcastMediaType(mediaType);
      setStartedAtMs(null);
      setComments([]);
      setCommentError(null);
      attachWs({ type: 'start', title: title.trim(), mediaType, ...(streamId ? { streamId } : {}) }, mediaType);
    },
    [attachWs],
  );

  const resume = useCallback(() => {
    const id = liveIdRef.current;
    if (!id) return;
    setError(null);
    setPhase('connecting');
    attachWs({ type: 'resume', liveId: id }, broadcastMediaType, { keepStartedAt: true });
  }, [attachWs, broadcastMediaType]);

  const stop = useCallback(async () => {
    const result = await cleanup(true);
    liveIdRef.current = null;
    if (result && (result.audioBlob?.size || result.videoBlob?.size)) {
      setRecording(result);
    }
    setPhase('ended');
  }, [cleanup]);

  const discardRecording = useCallback(() => {
    setRecording(null);
    setPhase('idle');
    setLiveId(null);
    liveIdRef.current = null;
    setBroadcastTitle('');
    setStartedAtMs(null);
    setComments([]);
    setCommentError(null);
    intentionalStopRef.current = false;
  }, []);

  const sendComment = useCallback((body: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setCommentError(LIVE_COPY.commentConnectionLost);
      return;
    }
    setCommentError(null);
    ws.send(JSON.stringify({ type: 'comment', body }));
  }, []);

  return {
    phase,
    liveId,
    listenersCount,
    error,
    recording,
    broadcastTitle,
    broadcastMediaType,
    startedAtMs,
    comments,
    commentError,
    previewRef,
    start,
    resume,
    stop,
    discardRecording,
    sendComment,
  };
};
