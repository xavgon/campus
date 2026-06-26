import type {
  LiveComment,
  LiveSession,
  ScheduledStream,
  ServerLiveRecording,
} from '@/features/live/types/live.types';
import type { PodcastApi } from '@/features/podcasts/types/podcast.api';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { mapPodcastFromApi } from '@/features/podcasts/utils/mapPodcast';
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

export const fetchLiveComments = async (streamId: string): Promise<LiveComment[]> => {
  const { data } = await api.get<ApiResponse<{ comments: LiveComment[]; total: number }>>(
    `/live/${streamId}/comments`,
  );
  return data.data.comments.map((row) => ({
    id: row.id,
    streamId: row.streamId ?? streamId,
    userId: row.userId,
    authorNome: row.authorNome,
    authorFoto: row.authorFoto ?? null,
    body: row.body,
    createdAt: row.createdAt,
    isHost: row.isHost === true,
  }));
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

export const fetchServerLiveRecordings = async (): Promise<ServerLiveRecording[]> => {
  const { data } = await api.get<ApiResponse<{ recordings: ServerLiveRecording[] }>>(
    '/live/recordings',
  );
  return data.data.recordings;
};

export const publishServerLiveRecording = async (
  recordingId: string,
  input: { title: string; description?: string; categoryId?: string },
): Promise<Podcast> => {
  const body: Record<string, unknown> = { title: input.title.trim() };
  if (input.description?.trim()) body.description = input.description.trim();
  if (input.categoryId) body.category_id = Number(input.categoryId);

  const { data } = await api.post<ApiResponse<{ podcast: PodcastApi }>>(
    `/live/recordings/${recordingId}/publish`,
    body,
  );
  return mapPodcastFromApi(data.data.podcast);
};
