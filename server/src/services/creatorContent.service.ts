import fs from 'fs';
import path from 'path';
import {
  clearPodcastCompressionJobs,
} from '../compression/compressionJobs';
import { clearCompressionProgress } from '../compression/progressStore';
import { endSessionsByHost } from '../live/live.gateway';
import { deletePodcastsByUserId, listPodcastMediaByUserId } from '../models/podcast.model';
import { deleteStreamsByHostUserId } from '../models/stream.model';

export interface PurgedCreatorContent {
  podcasts: number;
  streams: number;
}

const unlinkMediaFile = (urlField: string | null): void => {
  if (!urlField) return;
  const filePath = path.join(process.cwd(), urlField);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/** Remove podcasts, ficheiros e transmissões associadas a um criador. */
export const purgeCreatorContent = async (userId: string): Promise<PurgedCreatorContent> => {
  await endSessionsByHost(userId);

  const podcastRows = await listPodcastMediaByUserId(userId);
  for (const row of podcastRows) {
    clearCompressionProgress(row.id);
    clearPodcastCompressionJobs(row.id);
    unlinkMediaFile(row.audio_url);
    unlinkMediaFile(row.video_url);
    unlinkMediaFile(row.cover_url);
  }

  const podcasts = await deletePodcastsByUserId(userId);
  const streams = await deleteStreamsByHostUserId(userId);

  return { podcasts, streams };
};
