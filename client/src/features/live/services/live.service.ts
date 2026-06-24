import type { LiveSession, ScheduledStream } from '@/features/live/types/live.types';
import { api, SERVER_URL } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import { getToken } from '@/shared/utils/storage';

export const fetchActiveLiveSessions = async (): Promise<LiveSession[]> => {
  const { data } = await api.get<ApiResponse<{ sessions: LiveSession[]; total: number }>>('/live');
  return data.data.sessions;
};

export const fetchScheduledStreams = async (): Promise<ScheduledStream[]> => {
  const { data } = await api.get<ApiResponse<{ streams: ScheduledStream[]; total: number }>>(
    '/live/scheduled',
  );
  return data.data.streams;
};

export const buildLiveWebSocketUrl = (params: {
  role: 'broadcaster' | 'listener';
  liveId?: string;
}): string | null => {
  const token = getToken();
  if (!token) return null;

  const query = new URLSearchParams({ token, role: params.role });
  if (params.liveId) query.set('liveId', params.liveId);

  // Em dev, WebSocket via proxy do Vite (mesma origem que a UI — evita falhas cross-port)
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/live?${query}`;
  }

  const wsBase = SERVER_URL.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  return `${wsBase}/live?${query}`;
};
