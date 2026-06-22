export type LiveMediaType = 'audio' | 'video' | 'both';

export type LiveSessionStatus = 'connecting' | 'live' | 'ended' | 'error';

export interface LiveSession {
  id: string;
  title: string;
  mediaType: LiveMediaType;
  hostEmail: string;
  listenersCount: number;
  startedAt: string;
}

export interface LiveJoinedInfo {
  liveId: string;
  title: string;
  mediaType: LiveMediaType;
  hostEmail: string;
  startedAt: string;
}
