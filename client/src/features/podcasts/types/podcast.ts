export type PodcastStatus = 'published' | 'processing' | 'draft';

export type PodcastSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export interface Podcast {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  authorName: string;
  coverUrl?: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
  durationSeconds: number;
  status: PodcastStatus;
  createdAt: string;
  playCount?: number;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

export interface PodcastLibraryFilters {
  search: string;
  categoryId: string;
  sort: PodcastSort;
}
