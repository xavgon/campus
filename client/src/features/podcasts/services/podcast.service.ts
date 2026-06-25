import { CATEGORY_OTHER_ID } from '@/features/podcasts/constants';
import type { CompressionProgress } from '@/features/podcasts/types/compression';
import type { PodcastApi } from '@/features/podcasts/types/podcast.api';
import type { Podcast, PodcastCategory } from '@/features/podcasts/types/podcast';
import { mapPodcastFromApi } from '@/features/podcasts/utils/mapPodcast';
import { api } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import { getToken } from '@/shared/utils/storage';

export interface FetchPodcastsParams {
  search?: string;
  categoryId?: string;
}

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

export const fetchPodcasts = async (params: FetchPodcastsParams = {}): Promise<Podcast[]> => {
  const query: Record<string, string> = {};
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.categoryId) query.category_id = params.categoryId;

  const { data } = await api.get<ApiResponse<{ podcasts: PodcastApi[] }>>('/podcasts', {
    params: query,
  });

  return data.data.podcasts.map(mapPodcastFromApi);
};

export const fetchPublicPodcasts = async (
  params: FetchPodcastsParams = {},
): Promise<Podcast[]> => {
  const query: Record<string, string> = {};
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.categoryId) query.category_id = params.categoryId;

  const { data } = await api.get<ApiResponse<{ podcasts: PodcastApi[] }>>('/podcasts/public', {
    params: query,
  });

  return data.data.podcasts.map(mapPodcastFromApi);
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

/** Alias usado em fluxos que já montam FormData. */
export const publishPodcast = async (formData: FormData): Promise<Podcast> => {
  const { data } = await api.post<ApiResponse<{ podcast: PodcastApi }>>('/podcasts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
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

export const hasPodcastVideo = (podcast: Podcast): boolean => Boolean(podcast.videoUrl);

export const downloadPodcast = async (podcast: Podcast): Promise<void> => {
  const { data } = await api.get<Blob>(`/podcasts/${podcast.id}/download`, {
    responseType: 'blob',
  });

  const ext = podcast.audioUrl?.match(/\.[a-z0-9]+$/i)?.[0] ?? '.mp3';
  const safeTitle =
    podcast.title
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'podcast';

  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeTitle}${ext}`;
  link.click();
  URL.revokeObjectURL(url);
};
