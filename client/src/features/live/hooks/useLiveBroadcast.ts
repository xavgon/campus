import { useCallback, useEffect, useRef, useState } from 'react';
import { LIVE_TYPE_VIDEO } from '@/features/live/constants';
import { buildLiveWebSocketUrl } from '@/features/live/services/live.service';
import type { LiveMediaType } from '@/features/live/types/live.types';
import {
  startLiveCapture,
  type LiveCaptureHandles,
  type LiveRecordingResult,
} from '@/features/live/utils/liveMedia';

export type BroadcastPhase = 'idle' | 'connecting' | 'live' | 'ended' | 'error';

export const useLiveBroadcast = () => {
  const [phase, setPhase] = useState<BroadcastPhase>('idle');
  const [liveId, setLiveId] = useState<string | null>(null);
  const [listenersCount, setListenersCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState<LiveRecordingResult | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMediaType, setBroadcastMediaType] = useState<LiveMediaType>('audio');
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const captureRef = useRef<LiveCaptureHandles | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const wsGenerationRef = useRef(0);

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

  const cleanup = useCallback(
    async (collectRecording: boolean) => {
      let result: LiveRecordingResult | null = null;
      if (collectRecording) {
        result = await finalizeCapture();
      } else {
        await finalizeCapture();
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'stop' }));
        } catch {
          // ignore
        }
      }
      wsRef.current?.close();
      wsRef.current = null;
      wsGenerationRef.current += 1;

      return result;
    },
    [finalizeCapture],
  );

  useEffect(
    () => () => {
      void cleanup(false);
    },
    [cleanup],
  );

  const start = useCallback(
    async (title: string, mediaType: LiveMediaType) => {
      setError(null);
      setRecording(null);
      setPhase('connecting');
      setListenersCount(0);
      setLiveId(null);
      setBroadcastTitle(title.trim());
      setBroadcastMediaType(mediaType);
      setStartedAtMs(null);

      const url = buildLiveWebSocketUrl({ role: 'broadcaster' });
      if (!url) {
        setError('Sessão expirada. Entra novamente.');
        setPhase('error');
        return;
      }

      const ws = new WebSocket(url);
      const generation = ++wsGenerationRef.current;
      wsRef.current = ws;

      const isStale = () => generation !== wsGenerationRef.current;

      ws.onopen = () => {
        if (isStale()) return;
        ws.send(JSON.stringify({ type: 'start', title: title.trim(), mediaType }));
      };

      ws.onmessage = (event) => {
        if (isStale()) return;
        try {
          const msg = JSON.parse(String(event.data)) as {
            type: string;
            liveId?: string;
            message?: string;
            listenersCount?: number;
          };

          if (msg.type === 'started' && msg.liveId) {
            setLiveId(msg.liveId);
            setPhase('live');
            setStartedAtMs(Date.now());
            void startLiveCapture(mediaType, previewRef.current, (chunk) => {
              if (ws.readyState !== WebSocket.OPEN) return;
              // Evita fila enorme de JPEG no WebSocket — descarta frames de vídeo se o buffer crescer
              if (chunk[0] === LIVE_TYPE_VIDEO && ws.bufferedAmount > 384 * 1024) {
                return;
              }
              ws.send(new Uint8Array(chunk));
            })
              .then((handles) => {
                captureRef.current = handles;
              })
              .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Não foi possível aceder ao microfone/câmara.');
                setPhase('error');
                void cleanup(false);
              });
          }

          if (msg.type === 'stats' && typeof msg.listenersCount === 'number') {
            setListenersCount(msg.listenersCount);
          }

          if (msg.type === 'error') {
            setError(msg.message ?? 'Erro na transmissão.');
            setPhase('error');
            void cleanup(false);
          }
        } catch {
          // ignore malformed
        }
      };

      ws.onerror = () => {
        if (isStale()) return;
        setError('Não foi possível ligar ao servidor de transmissão. Confirma que a API está a correr.');
        setPhase('error');
        void cleanup(false);
      };

      ws.onclose = () => {
        if (isStale()) return;
        setPhase((prev) => (prev === 'error' ? 'error' : prev));
      };
    },
    [cleanup],
  );

  const stop = useCallback(async () => {
    const result = await cleanup(true);
    if (result && (result.audioBlob?.size || result.videoBlob?.size)) {
      setRecording(result);
    }
    setPhase('ended');
  }, [cleanup]);

  const discardRecording = useCallback(() => {
    setRecording(null);
    setPhase('idle');
    setLiveId(null);
    setBroadcastTitle('');
    setStartedAtMs(null);
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
    previewRef,
    start,
    stop,
    discardRecording,
  };
};
