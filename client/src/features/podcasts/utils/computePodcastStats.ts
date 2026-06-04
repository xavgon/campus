import type { Podcast } from '@/features/podcasts/types/podcast';

export interface PodcastStats {
  total: number;
  published: number;
  processing: number;
  draft: number;
  totalPlays: number;
}

export const computePodcastStats = (podcasts: Podcast[]): PodcastStats => {
  let published = 0;
  let processing = 0;
  let draft = 0;
  let totalPlays = 0;

  for (const podcast of podcasts) {
    if (podcast.status === 'published') {
      published += 1;
      totalPlays += podcast.playCount ?? 0;
    } else if (podcast.status === 'processing') {
      processing += 1;
    } else if (podcast.status === 'draft') {
      draft += 1;
    }
  }

  return {
    total: podcasts.length,
    published,
    processing,
    draft,
    totalPlays,
  };
};
