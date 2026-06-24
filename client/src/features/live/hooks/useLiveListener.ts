import { useCallback, useEffect, useRef, useState } from 'react';
import { LIVE_TYPE_AUDIO, LIVE_TYPE_VIDEO } from '@/features/live/constants';
import { buildLiveWebSocketUrl } from '@/features/live/services/live.service';
import type { LiveJoinedInfo, LiveMediaType } from '@/features/live/types/live.types';
import {
  createListenerAudioContext,
  playLiveAudioChunk,
  wantsLiveAudio,
  wantsLiveVideo,
} from '@/features/live/utils/liveMedia';
import { resetAudioSchedule } from '@/features/live/utils/liveAudioPlayback';
import { createLiveVideoRenderer, type LiveVideoRenderer } from '@/features/live/utils/liveVideoRenderer';

export type ListenerPhase = 'idle' | 'connecting' | 'watching' | 'ended' | 'error';

const listenerCloseMessage = (code: number, reason: string): string => {
  if (code === 1008) {
    return reason || 'Esta transmissão já não está activa.';
  }
  if (code === 1006) {
    return 'Não foi possível ligar ao servidor. Confirma que a API está a correr (porta 3001).';
  }
  return 'Não foi possível entrar na transmissão. Pode já ter terminado.';
};

export const useLiveListener = (liveId: string | undefined) => {
  const [phase, setPhase] = useState<ListenerPhase>('idle');
  const [session, setSession] = useState<LiveJoinedInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioScheduleRef = useRef({ next: 0 });
  const videoRendererRef = useRef<LiveVideoRenderer | null>(null);

  const attachViewerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    videoRendererRef.current?.dispose();
    videoRendererRef.current = createLiveVideoRenderer(canvas);
  }, []);

  useEffect(() => {
    if (!liveId) return;

    let disposed = false;
    let joined = false;
    let serverError = false;

    setError(null);
    setPhase('connecting');
    setSession(null);
    setNeedsAudioUnlock(false);

    const url = buildLiveWebSocketUrl({ role: 'listener', liveId });
    if (!url) {
      setError('Sessão expirada. Entra novamente.');
      setPhase('error');
      return;
    }

    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

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
            setPhase('watching');
            if (wantsLiveAudio(msg.mediaType)) {
              audioCtxRef.current = createListenerAudioContext();
              audioScheduleRef.current.next = 0;
              resetAudioSchedule(audioScheduleRef.current, audioCtxRef.current);
              setNeedsAudioUnlock(audioCtxRef.current.state === 'suspended');
            }
          }

          if (msg.type === 'ended') {
            setPhase('ended');
          }

          if (msg.type === 'error') {
            serverError = true;
            setError(msg.message ?? 'Não foi possível entrar na transmissão.');
            setPhase('error');
          }
        } catch {
          // ignore
        }
        return;
      }

      const view = new Uint8Array(event.data as ArrayBuffer);
      const type = view[0];
      const payload = (event.data as ArrayBuffer).slice(1);

      if (type === LIVE_TYPE_VIDEO) {
        videoRendererRef.current?.pushFrame(payload);
      } else if (type === LIVE_TYPE_AUDIO && audioCtxRef.current) {
        playLiveAudioChunk(audioCtxRef.current, payload, audioScheduleRef.current);
      }
    };

    ws.onerror = () => {
      if (disposed || joined || serverError) return;
      setError('Não foi possível ligar ao servidor de transmissão.');
      setPhase('error');
    };

    ws.onclose = (event) => {
      if (disposed) return;

      if (joined && !serverError) {
        setPhase((prev) => (prev === 'watching' ? 'ended' : prev));
        return;
      }

      if (!joined && !serverError) {
        setError(listenerCloseMessage(event.code, event.reason));
        setPhase('error');
      }
    };

    return () => {
      disposed = true;
      ws.close();
      videoRendererRef.current?.dispose();
      videoRendererRef.current = null;
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [liveId]);

  const unlockAudio = async () => {
    if (!audioCtxRef.current) return;
    await audioCtxRef.current.resume();
    resetAudioSchedule(audioScheduleRef.current, audioCtxRef.current);
    setNeedsAudioUnlock(false);
  };

  const showVideo = session ? wantsLiveVideo(session.mediaType) : false;

  return {
    phase,
    session,
    error,
    needsAudioUnlock,
    showVideo,
    attachViewerCanvas,
    unlockAudio,
  };
};
