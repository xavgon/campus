import type { PodcastApi } from '@/features/podcasts/types/podcast.api';
import type { Podcast, PodcastStatus } from '@/features/podcasts/types/podcast';
import { SERVER_URL } from '@/shared/api/client';

const resolveMediaUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SERVER_URL}${path}`;
};

const deriveStatus = (api: PodcastApi): PodcastStatus => {
  if (api.compressed_size != null) return 'published';
  if (api.audio_url) return 'processing';
  return 'draft';
};

export const mapPodcastFromApi = (api: PodcastApi): Podcast => ({
  id: api.id,
  title: api.title,
  description: api.description ?? '',
  categoryId: api.category_id != null ? String(api.category_id) : '',
  categoryName: api.category_name ?? 'Sem categoria',
  authorName: api.author_nome,
  coverUrl: resolveMediaUrl(api.cover_url),
  audioUrl: resolveMediaUrl(api.audio_url),
  videoUrl: resolveMediaUrl(api.video_url),
  durationSeconds: 0,
  status: deriveStatus(api),
  createdAt: api.created_at,
  originalSize: api.original_size ?? undefined,
  compressedSize: api.compressed_size ?? undefined,
  compressionRatio: api.compression_ratio ?? undefined,
});
