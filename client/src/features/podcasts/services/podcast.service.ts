import { CATEGORY_OTHER_ID } from '@/features/podcasts/constants';
import type { CompressionProgress } from '@/features/podcasts/types/compression';
import type { PodcastApi, PublicPodcastApi } from '@/features/podcasts/types/podcast.api';
import type { Podcast, PodcastCategory, PodcastSort } from '@/features/podcasts/types/podcast';
import type {
  PodcastListResult,
  PodcastPaginationMeta,
} from '@/features/podcasts/types/pagination';
import { PODCAST_PAGE_SIZE } from '@/features/podcasts/types/pagination';
import { resolveDownloadFilename, triggerBrowserDownload } from '@/features/podcasts/utils/downloadPodcast';
import { mapPodcastFromApi, mapPublicPodcastFromApi } from '@/features/podcasts/utils/mapPodcast';
import { api } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import { getToken } from '@/shared/utils/storage';

export interface FetchPodcastsParams {
  search?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  sort?: PodcastSort;
}

export interface PublicPodcastListResult {
  podcasts: Podcast[];
  pagination: PodcastPaginationMeta;
}

const buildListQuery = (params: FetchPodcastsParams): Record<string, string> => {
  const query: Record<string, string> = {};
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.categoryId) query.category_id = params.categoryId;
  if (params.page != null) query.page = String(params.page);
  if (params.limit != null) query.limit = String(params.limit);
  if (params.sort) query.sort = params.sort;
  return query;
};

export interface CreatePodcastInput {
  title: string;
  description?: string;
  categoryId: string;
  audio: File;
  video?: File | null;
  cover?: File | null;
}

export const fetchPodcastCategories = async (): Promise<PodcastCategory[]> => {
  const { data } = await api.get<ApiResponse<{ categories: { id: number; name: string }[] }>>(
    '/categories',
  );
  return data.data.categories.map((cat) => ({
    id: String(cat.id),
    name: cat.name,
  }));
};

/** Categorias para o catálogo público (sem autenticação). */
export const fetchPublicPodcastCategories = async (): Promise<PodcastCategory[]> => {
  const { data } = await api.get<ApiResponse<{ categories: { id: number; name: string }[] }>>(
    '/categories/public',
  );
  return data.data.categories.map((cat) => ({
    id: String(cat.id),
    name: cat.name,
  }));
};

export const fetchPodcasts = async (params: FetchPodcastsParams = {}): Promise<PodcastListResult> => {
  const { data } = await api.get<
    ApiResponse<{
      podcasts: PodcastApi[];
      pagination: PodcastPaginationMeta;
      summary?: PodcastListResult['summary'];
    }>
  >('/podcasts', {
    params: buildListQuery({
      limit: PODCAST_PAGE_SIZE,
      ...params,
    }),
  });

  return {
    podcasts: data.data.podcasts.map(mapPodcastFromApi),
    pagination: data.data.pagination,
    summary: data.data.summary,
  };
};

export const fetchPublicPodcasts = async (
  params: FetchPodcastsParams = {},
): Promise<PublicPodcastListResult> => {
  const { data } = await api.get<
    ApiResponse<{ podcasts: PublicPodcastApi[]; pagination: PodcastPaginationMeta }>
  >('/podcasts/public', {
    params: buildListQuery({
      limit: PODCAST_PAGE_SIZE,
      ...params,
    }),
  });

  return {
    podcasts: data.data.podcasts.map(mapPublicPodcastFromApi),
    pagination: data.data.pagination,
  };
};

export const fetchPublicPodcastById = async (id: string): Promise<Podcast> => {
  const { data } = await api.get<ApiResponse<{ podcast: PublicPodcastApi }>>(
    `/podcasts/public/${id}`,
  );
  return mapPublicPodcastFromApi(data.data.podcast);
};

export const fetchPodcastById = async (id: string): Promise<Podcast> => {
  const { data } = await api.get<ApiResponse<{ podcast: PodcastApi }>>(`/podcasts/${id}`);
  return mapPodcastFromApi(data.data.podcast);
};

export const fetchCompressionProgress = async (id: string): Promise<CompressionProgress | null> => {
  const { data } = await api.get<ApiResponse<{ progress: CompressionProgress | null }>>(
    `/podcasts/${id}/compression-progress`,
  );
  return data.data.progress;
};

export const createPodcast = async (input: CreatePodcastInput): Promise<Podcast> => {
  const formData = new FormData();
  formData.append('title', input.title.trim());
  if (input.description?.trim()) {
    formData.append('description', input.description.trim());
  }
  if (input.categoryId && input.categoryId !== CATEGORY_OTHER_ID) {
    formData.append('category_id', input.categoryId);
  }
  formData.append('audio', input.audio);
  if (input.video) {
    formData.append('video', input.video);
  }
  if (input.cover) {
    formData.append('cover', input.cover);
  }

  const { data } = await api.post<ApiResponse<{ podcast: PodcastApi }>>('/podcasts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return mapPodcastFromApi(data.data.podcast);
};

export interface PublishPodcastOptions {
  onUploadProgress?: (percent: number) => void;
}

/** Alias usado em fluxos que já montam FormData. */
export const publishPodcast = async (
  formData: FormData,
  options?: PublishPodcastOptions,
): Promise<Podcast> => {
  const { data } = await api.post<ApiResponse<{ podcast: PodcastApi }>>('/podcasts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300_000,
    onUploadProgress: (event) => {
      if (!event.total || !options?.onUploadProgress) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      options.onUploadProgress(percent);
    },
  });
  return mapPodcastFromApi(data.data.podcast);
};

export interface UpdatePodcastInput {
  title?: string;
  description?: string;
  categoryId?: string;
}

export const updatePodcast = async (id: string, input: UpdatePodcastInput): Promise<Podcast> => {
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title.trim();
  if (input.description !== undefined) body.description = input.description.trim() || null;
  if (input.categoryId !== undefined) {
    if (input.categoryId && input.categoryId !== CATEGORY_OTHER_ID) {
      body.category_id = Number(input.categoryId);
    } else {
      body.category_id = null;
    }
  }

  const { data } = await api.patch<ApiResponse<{ podcast: PodcastApi }>>(`/podcasts/${id}`, body);
  return mapPodcastFromApi(data.data.podcast);
};

export const deletePodcast = async (id: string): Promise<void> => {
  await api.delete(`/podcasts/${id}`);
};

/** URL de streaming com token na query (necessário para `<audio>` / `<video>`). */
export const getPodcastStreamUrl = (podcastId: string): string | null => {
  const token = getToken();
  if (!token) return null;
  const base = api.defaults.baseURL ?? 'http://localhost:3001/api';
  return `${base}/stream/${podcastId}?token=${encodeURIComponent(token)}`;
};

export const getPodcastVideoStreamUrl = (podcastId: string): string | null => {
  const token = getToken();
  if (!token) return null;
  const base = api.defaults.baseURL ?? 'http://localhost:3001/api';
  return `${base}/stream/${podcastId}/video?token=${encodeURIComponent(token)}`;
};

export const canPlayPodcast = (podcast: Podcast): boolean =>
  Boolean(podcast.audioUrl || podcast.videoUrl) && podcast.status !== 'draft';

export { canDownloadPodcast } from '@/features/podcasts/utils/downloadPodcast';

export const hasPodcastVideo = (podcast: Podcast): boolean => Boolean(podcast.videoUrl);

export type DownloadPodcastMedia = 'audio' | 'video';

export const downloadPodcast = async (
  podcast: Podcast,
  media: DownloadPodcastMedia = 'audio',
): Promise<void> => {
  const response = await api.get<Blob>(`/podcasts/${podcast.id}/download`, {
    responseType: 'blob',
    params: media === 'video' ? { media: 'video' } : undefined,
  });

  const filename = resolveDownloadFilename(
    podcast,
    media,
    response.headers['content-disposition'],
  );
  triggerBrowserDownload(response.data, filename);
};
