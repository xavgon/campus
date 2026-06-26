export type LiveMediaType = 'audio' | 'video' | 'both';

export type LiveSessionStatus = 'connecting' | 'live' | 'ended' | 'error';

export interface LiveSession {
  id: string;
  title: string;
  mediaType: LiveMediaType;
  hostEmail: string;
  hostNome?: string | null;
  listenersCount: number;
  startedAt: string;
  status?: 'live' | 'scheduled' | 'ended';
  awaitingReconnect?: boolean;
}

export interface ScheduledStream {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  host_nome: string | null;
  media_type: LiveMediaType | null;
}

export interface LiveJoinedInfo {
  liveId: string;
  title: string;
  mediaType: LiveMediaType;
  hostEmail: string;
  startedAt: string;
}

export interface LiveComment {
  id: string;
  streamId: string;
  userId: string;
  authorNome: string;
  authorFoto: string | null;
  body: string;
  createdAt: string;
  isHost: boolean;
}

export interface ServerLiveRecording {
  id: string;
  title: string;
  mediaType: LiveMediaType;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
  hasAudio: boolean;
  hasVideo: boolean;
  publishedPodcastId: string | null;
}
