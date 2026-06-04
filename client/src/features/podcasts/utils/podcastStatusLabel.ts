import type { PodcastStatus } from '@/features/podcasts/types/podcast';

const STATUS_LABELS: Record<PodcastStatus, string> = {
  published: 'Publicado',
  processing: 'A processar',
  draft: 'Rascunho',
};

export const podcastStatusLabel = (status: PodcastStatus): string =>
  STATUS_LABELS[status];
