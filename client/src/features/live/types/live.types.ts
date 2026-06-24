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
}

export interface ScheduledStream {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  host_nome: string | null;
}

export interface LiveJoinedInfo {
  liveId: string;
  title: string;
  mediaType: LiveMediaType;
  hostEmail: string;
  startedAt: string;
}
