import type { PodcastApi, PublicPodcastApi } from '@/features/podcasts/types/podcast.api';
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

export const mapPodcastFromApi = (api: PodcastApi): Podcast => {
  const audioUrl = resolveMediaUrl(api.audio_url);
  const videoUrl = resolveMediaUrl(api.video_url);

  return {
    id: api.id,
    title: api.title,
    description: api.description ?? '',
    categoryId: api.category_id != null ? String(api.category_id) : '',
    categoryName: api.category_name ?? 'Sem categoria',
    authorName: api.author_nome,
    authorId: api.user_id,
    authorCertFingerprint: api.author_cert_fingerprint,
    authorCertCn: api.author_cert_cn,
    coverUrl: resolveMediaUrl(api.cover_url),
    audioUrl,
    videoUrl,
    mediaUrl: videoUrl ?? audioUrl,
    mediaType: videoUrl ? 'video' : audioUrl ? 'audio' : undefined,
    durationSeconds: api.duration_seconds ?? 0,
    mediaFormat: api.media_format ?? undefined,
    status: deriveStatus(api),
    createdAt: api.created_at,
    originalSize: api.original_size ?? undefined,
    compressedSize: api.compressed_size ?? undefined,
    compressionRatio: api.compression_ratio ?? undefined,
    processingTimeMs: api.processing_time_ms ?? undefined,
  };
};

export const mapPublicPodcastFromApi = (api: PublicPodcastApi): Podcast => ({
  id: api.id,
  title: api.title,
  description: api.description ?? '',
  categoryId: api.category_id != null ? String(api.category_id) : '',
  categoryName: api.category_name ?? 'Sem categoria',
  authorName: api.author_nome,
  authorId: '',
  coverUrl: resolveMediaUrl(api.cover_url),
  durationSeconds: api.duration_seconds ?? 0,
  status: 'published',
  createdAt: api.created_at,
});
