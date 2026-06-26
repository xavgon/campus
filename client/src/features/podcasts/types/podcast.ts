export type PodcastStatus = 'published' | 'processing' | 'draft';

export type PodcastSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export interface PodcastCategory {
  id: string;
  name: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  authorName: string;
  authorId: string;
  authorCertFingerprint?: string | null;
  authorCertCn?: string | null;
  coverUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  /** URL principal para preview na listagem (vídeo ou áudio). */
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
  durationSeconds: number;
  mediaFormat?: string;
  status: PodcastStatus;
  createdAt: string;
  playCount?: number;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
  processingTimeMs?: number;
}

export interface PodcastLibraryFilters {
  search: string;
  categoryId: string;
  sort: PodcastSort;
}
