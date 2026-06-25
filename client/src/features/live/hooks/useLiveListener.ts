import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LIVE_LISTENER_MAX_RETRIES,
  LIVE_LISTENER_RETRY_MS,
  LIVE_TYPE_AUDIO,
  LIVE_TYPE_VIDEO,
} from '@/features/live/constants';
import { buildLiveWebSocketUrl } from '@/features/live/services/live.service';
import type { LiveComment, LiveJoinedInfo, LiveMediaType } from '@/features/live/types/live.types';
import {
  applyLiveCommentWsMessage,
  mergeLiveComments,
} from '@/features/live/utils/liveComments';
import {
  LIVE_COPY,
  liveListenerCloseMessage,
} from '@/shared/copy/campusMessages';
import {
  createListenerAudioContext,
  playLiveAudioChunk,
  wantsLiveAudio,
  wantsLiveVideo,
} from '@/features/live/utils/liveMedia';
import { resetAudioSchedule } from '@/features/live/utils/liveAudioPlayback';
import { createLiveVideoRenderer, type LiveVideoRenderer } from '@/features/live/utils/liveVideoRenderer';

export type ListenerPhase = 'idle' | 'connecting' | 'watching' | 'reconnecting' | 'ended' | 'error';

const isRetryableClose = (code: number, reason: string) =>
  code === 1008 && (reason === 'Live offline' || reason.includes('reconectar'));

export const useLiveListener = (liveId: string | undefined) => {
  const [phase, setPhase] = useState<ListenerPhase>('idle');
  const [session, setSession] = useState<LiveJoinedInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentError, setCommentError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioScheduleRef = useRef({ next: 0 });
  const videoRendererRef = useRef<LiveVideoRenderer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const attachViewerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    videoRendererRef.current?.dispose();
    videoRendererRef.current = createLiveVideoRenderer(canvas);
  }, []);

  useEffect(() => {
    if (!liveId) return;

    let disposed = false;
    let joined = false;
    let serverError = false;
    let retryable = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let ws: WebSocket | null = null;

    const cleanupMedia = () => {
      videoRendererRef.current?.dispose();
      videoRendererRef.current = null;
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };

    const scheduleRetry = () => {
      if (disposed || joined || serverError) return;
      if (retryAttempt >= LIVE_LISTENER_MAX_RETRIES) {
        setError(LIVE_COPY.listenerRetryExhausted);
        setPhase('error');
        return;
      }
      setPhase('connecting');
      retryTimer = setTimeout(() => {
        if (!disposed) setRetryAttempt((n) => n + 1);
      }, LIVE_LISTENER_RETRY_MS);
    };

    setError(null);
    setPhase(retryAttempt > 0 ? 'connecting' : 'connecting');
    if (retryAttempt === 0) {
      setSession(null);
      setNeedsAudioUnlock(false);
      setComments([]);
      setCommentError(null);
    }

    const url = buildLiveWebSocketUrl({ role: 'listener', liveId });
    if (!url) {
      setError(LIVE_COPY.sessionExpired);
      setPhase('error');
      return;
    }

    ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    const handleCommentMessage = (msg: {
      type: string;
      comment?: unknown;
      comments?: unknown[];
      message?: string;
    }) => {
      applyLiveCommentWsMessage(msg, {
        onHistory: (items) => setComments(items),
        onComment: (comment) => setComments((prev) => mergeLiveComments(prev, [comment])),
        onError: (message) => setCommentError(message),
      });
    };

    ws.onmessage = (event) => {
      if (disposed) return;

      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data) as {
            type: string;
            liveId?: string;
            title?: string;
            mediaType?: LiveMediaType;
            hostEmail?: string;
            startedAt?: string;
            message?: string;
            retryable?: boolean;
            awaitingHost?: boolean;
          };

          if (msg.type === 'joined' && msg.liveId && msg.title && msg.mediaType && msg.hostEmail && msg.startedAt) {
            joined = true;
            setSession({
              liveId: msg.liveId,
              title: msg.title,
              mediaType: msg.mediaType,
              hostEmail: msg.hostEmail,
              startedAt: msg.startedAt,
            });
            setPhase(msg.awaitingHost ? 'reconnecting' : 'watching');
            if (wantsLiveAudio(msg.mediaType)) {
              if (!audioCtxRef.current) {
                audioCtxRef.current = createListenerAudioContext();
                audioScheduleRef.current.next = 0;
                resetAudioSchedule(audioScheduleRef.current, audioCtxRef.current);
              }
              setNeedsAudioUnlock(audioCtxRef.current.state === 'suspended');
            }
          }

          if (msg.type === 'host_reconnecting') {
            setPhase('reconnecting');
          }

          if (msg.type === 'host_back') {
            setPhase('watching');
          }

          if (msg.type === 'ended') {
            setPhase('ended');
          }

          if (msg.type === 'error') {
            serverError = !msg.retryable;
            retryable = msg.retryable === true;
            if (msg.retryable) {
              scheduleRetry();
              return;
            }
            setError(msg.message ?? LIVE_COPY.listenerJoinFailed);
            setPhase('error');
          }

          handleCommentMessage(msg);
        } catch {
          // ignore
        }
        return;
      }

      const view = new Uint8Array(event.data as ArrayBuffer);
      const type = view[0];
      const payload = (event.data as ArrayBuffer).slice(1);

      if (type === LIVE_TYPE_VIDEO) {
        setPhase((prev) => (prev === 'reconnecting' || prev === 'connecting' ? 'watching' : prev));
        videoRendererRef.current?.pushFrame(payload);
      } else if (type === LIVE_TYPE_AUDIO && audioCtxRef.current) {
        setPhase((prev) => (prev === 'reconnecting' || prev === 'connecting' ? 'watching' : prev));
        playLiveAudioChunk(audioCtxRef.current, payload, audioScheduleRef.current);
      }
    };

    ws.onerror = () => {
      if (disposed || joined || serverError) return;
      setError(LIVE_COPY.listenerWsFailed);
      setPhase('error');
    };

    ws.onclose = (event) => {
      if (disposed) return;

      if (joined && !serverError) {
        setPhase((prev) => (prev === 'watching' || prev === 'reconnecting' ? 'ended' : prev));
        return;
      }

      if (!joined && !serverError && (retryable || isRetryableClose(event.code, event.reason))) {
        scheduleRetry();
        return;
      }

      if (!joined && !serverError) {
        setError(liveListenerCloseMessage(event.code, event.reason));
        setPhase('error');
      }
    };

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      wsRef.current = null;
      ws?.close();
      cleanupMedia();
    };
  }, [liveId, retryAttempt]);

  const sendComment = useCallback((body: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setCommentError(LIVE_COPY.commentConnectionLost);
      return;
    }
    setCommentError(null);
    ws.send(JSON.stringify({ type: 'comment', body }));
  }, []);

  const unlockAudio = async () => {
    if (!audioCtxRef.current) return;
    await audioCtxRef.current.resume();
    resetAudioSchedule(audioScheduleRef.current, audioCtxRef.current);
    setNeedsAudioUnlock(false);
  };

  const retry = useCallback(() => {
    setError(null);
    setRetryAttempt(0);
    setPhase('connecting');
  }, []);

  const showVideo = session ? wantsLiveVideo(session.mediaType) : false;

  return {
    phase,
    session,
    error,
    needsAudioUnlock,
    showVideo,
    comments,
    commentError,
    attachViewerCanvas,
    unlockAudio,
    retry,
    sendComment,
  };
};
