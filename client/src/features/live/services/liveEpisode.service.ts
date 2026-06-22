import type { PodcastApi } from '@/features/podcasts/types/podcast.api';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { mapPodcastFromApi } from '@/features/podcasts/utils/mapPodcast';
import { CATEGORY_OTHER_ID } from '@/features/podcasts/constants';
import type { LiveRecordingResult } from '@/features/live/utils/liveMedia';
import {
  blobToFile,
  type LiveEpisodeFormat,
} from '@/features/live/utils/liveRecording';
import { api } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';

export interface CreatePodcastFromLiveInput {
  title: string;
  description?: string;
  categoryId: string;
  format: LiveEpisodeFormat;
  recording: LiveRecordingResult;
}

export const createPodcastFromLive = async (
  input: CreatePodcastFromLiveInput,
): Promise<Podcast> => {
  const formData = new FormData();
  formData.append('title', input.title.trim());

  if (input.description?.trim()) {
    formData.append('description', input.description.trim());
  }

  if (input.categoryId && input.categoryId !== CATEGORY_OTHER_ID) {
    formData.append('category_id', input.categoryId);
  }

  const stamp = Date.now();

  if (input.format === 'audiovideo' && input.recording.videoBlob) {
    formData.append(
      'video',
      blobToFile(input.recording.videoBlob, `live-${stamp}.webm`),
    );
    if (input.recording.audioBlob) {
      formData.append(
        'audio',
        blobToFile(input.recording.audioBlob, `live-${stamp}-audio.webm`),
      );
    }
  } else if (input.recording.audioBlob) {
    formData.append(
      'audio',
      blobToFile(input.recording.audioBlob, `live-${stamp}.webm`),
    );
  } else {
    throw new Error('Gravação vazia — não há áudio para publicar.');
  }

  const { data } = await api.post<ApiResponse<{ podcast: PodcastApi }>>('/podcasts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return mapPodcastFromApi(data.data.podcast);
};
