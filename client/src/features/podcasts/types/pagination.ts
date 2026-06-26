export interface PodcastPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PodcastListSummary {
  published: number;
  processing: number;
  draft: number;
}

export interface PodcastListResult {
  podcasts: import('@/features/podcasts/types/podcast').Podcast[];
  pagination: PodcastPaginationMeta;
  summary?: PodcastListSummary;
}

export const PODCAST_PAGE_SIZE = 12;
