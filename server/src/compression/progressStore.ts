export type CompressionMedia = 'audio' | 'video';

export interface PodcastCompressionProgress {
  audio: number | null;
  video: number | null;
  overall: number;
  active: boolean;
}

interface ProgressEntry {
  audio?: number;
  video?: number;
  updatedAt: number;
}

const store = new Map<string, ProgressEntry>();

const clampPercent = (value: number): number =>
  Math.max(0, Math.min(99, Math.round(value)));

export const initCompressionProgress = (
  podcastId: string,
  media: CompressionMedia,
): void => {
  const entry = store.get(podcastId) ?? { updatedAt: Date.now() };
  entry[media] = 0;
  entry.updatedAt = Date.now();
  store.set(podcastId, entry);
};

export const setCompressionProgress = (
  podcastId: string,
  media: CompressionMedia,
  percent: number,
): void => {
  const entry = store.get(podcastId) ?? { updatedAt: Date.now() };
  entry[media] = clampPercent(percent);
  entry.updatedAt = Date.now();
  store.set(podcastId, entry);
};

export const markCompressionComplete = (
  podcastId: string,
  media: CompressionMedia,
): void => {
  const entry = store.get(podcastId) ?? { updatedAt: Date.now() };
  entry[media] = 100;
  entry.updatedAt = Date.now();
  store.set(podcastId, entry);

  setTimeout(() => {
    const current = store.get(podcastId);
    if (!current) return;
    delete current[media];
    if (current.audio == null && current.video == null) {
      store.delete(podcastId);
      return;
    }
    store.set(podcastId, current);
  }, 30_000);
};

export const clearCompressionProgress = (podcastId: string): void => {
  store.delete(podcastId);
};

export const readCompressionProgress = (
  podcastId: string,
): PodcastCompressionProgress | null => {
  const entry = store.get(podcastId);
  if (!entry) return null;

  const audio = entry.audio ?? null;
  const video = entry.video ?? null;
  const parts = [audio, video].filter((value): value is number => value != null);
  if (parts.length === 0) return null;

  const overall = Math.round(parts.reduce((sum, value) => sum + value, 0) / parts.length);
  return {
    audio,
    video,
    overall,
    active: parts.some((value) => value < 100),
  };
};
