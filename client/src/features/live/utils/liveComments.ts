import type { LiveComment } from '@/features/live/types/live.types';

export const parseLiveComment = (raw: unknown): LiveComment | null => {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  if (
    typeof c.id !== 'string' ||
    typeof c.streamId !== 'string' ||
    typeof c.userId !== 'string' ||
    typeof c.authorNome !== 'string' ||
    typeof c.body !== 'string' ||
    typeof c.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    id: c.id,
    streamId: c.streamId,
    userId: c.userId,
    authorNome: c.authorNome,
    authorFoto: typeof c.authorFoto === 'string' ? c.authorFoto : null,
    body: c.body,
    createdAt: c.createdAt,
    isHost: c.isHost === true,
  };
};

export const mergeLiveComments = (prev: LiveComment[], incoming: LiveComment[]): LiveComment[] => {
  const map = new Map(prev.map((item) => [item.id, item]));
  for (const item of incoming) {
    map.set(item.id, item);
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

export const formatLiveCommentTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};

export const applyLiveCommentWsMessage = (
  msg: { type: string; comment?: unknown; comments?: unknown[]; message?: string },
  handlers: {
    onHistory: (comments: LiveComment[]) => void;
    onComment: (comment: LiveComment) => void;
    onError: (message: string) => void;
  },
): void => {
  if (msg.type === 'comments_history' && Array.isArray(msg.comments)) {
    const parsed = msg.comments
      .map((item) => parseLiveComment(item))
      .filter((item): item is LiveComment => item != null);
    handlers.onHistory(parsed);
    return;
  }

  if (msg.type === 'comment') {
    const parsed = parseLiveComment(msg.comment);
    if (parsed) handlers.onComment(parsed);
    return;
  }

  if (msg.type === 'comment_error' && typeof msg.message === 'string') {
    handlers.onError(msg.message);
  }
};
