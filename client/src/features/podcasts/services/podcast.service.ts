import { api } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';

export interface ApiPodcast {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  cover_url: string | null;
  original_size: number | null;
  compressed_size: number | null;
  compression_ratio: number | null;
  category_id: number | null;
  category_name: string | null;
  user_id: string;
  author_nome: string;
  created_at: string;
}

export const fetchPodcasts = async (params?: {
  search?: string;
  category_id?: number;
}): Promise<ApiPodcast[]> => {
  const { data } = await api.get<ApiResponse<{ podcasts: ApiPodcast[] }>>('/podcasts', { params });
  return data.data?.podcasts ?? [];
};

export const publishPodcast = async (formData: FormData): Promise<ApiPodcast> => {
  const { data } = await api.post<ApiResponse<{ podcast: ApiPodcast }>>('/podcasts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data!.podcast;
};

export const deletePodcast = async (id: string): Promise<void> => {
  await api.delete(`/podcasts/${id}`);
};
