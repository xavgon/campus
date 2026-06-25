import type { CompressionResult } from '../compression/compress';
import {
  finalizePodcastCompression,
  findPodcastById,
  updatePodcastCompressedMedia,
} from '../models/podcast.model';
import {
  notifyPodcastCatalogReady,
  notifyPodcastCompressionFailed,
} from '../services/adminNotification.service';

export type CompressionMedia = 'audio' | 'video';

interface PendingCompression {
  remaining: number;
  originalSize: number;
  results: Array<{
    media: CompressionMedia;
    url: string;
    compressedSize: number;
    processingTimeMs: number;
  }>;
}

const pending = new Map<string, PendingCompression>();

export const registerPodcastCompressionJobs = (
  podcastId: string,
  jobCount: number,
  originalSize: number,
): void => {
  if (jobCount <= 0) return;
  pending.set(podcastId, {
    remaining: jobCount,
    originalSize,
    results: [],
  });
};

export const clearPodcastCompressionJobs = (podcastId: string): void => {
  pending.delete(podcastId);
};

const finalizeFromPending = async (podcastId: string, entry: PendingCompression): Promise<void> => {
  if (entry.results.length === 0) return;

  const totalCompressed = entry.results.reduce((sum, item) => sum + item.compressedSize, 0);
  const compressionRatio =
    entry.originalSize > 0
      ? Math.round((1 - totalCompressed / entry.originalSize) * 10000) / 100
      : 0;
  const processingTimeMs = Math.max(...entry.results.map((item) => item.processingTimeMs));

  await finalizePodcastCompression(
    podcastId,
    totalCompressed,
    compressionRatio,
    processingTimeMs,
  );

  const podcast = await findPodcastById(podcastId);
  if (podcast) void notifyPodcastCatalogReady(podcast);
};

const completeJob = async (
  podcastId: string,
  media: CompressionMedia,
  result: CompressionResult,
  compressedUrl: string,
): Promise<void> => {
  await updatePodcastCompressedMedia(podcastId, media, compressedUrl);

  const entry = pending.get(podcastId);
  if (!entry) {
    await finalizePodcastCompression(
      podcastId,
      result.compressedSize,
      result.compressionRatio,
      result.processingTimeMs,
    );
    return;
  }

  entry.results.push({
    media,
    url: compressedUrl,
    compressedSize: result.compressedSize,
    processingTimeMs: result.processingTimeMs,
  });
  entry.remaining -= 1;

  if (entry.remaining > 0) {
    pending.set(podcastId, entry);
    return;
  }

  pending.delete(podcastId);
  await finalizeFromPending(podcastId, entry);
};

const failJob = async (podcastId: string): Promise<void> => {
  const entry = pending.get(podcastId);
  if (!entry) {
    const podcast = await findPodcastById(podcastId);
    if (podcast) void notifyPodcastCompressionFailed(podcast);
    return;
  }

  entry.remaining -= 1;
  if (entry.remaining > 0) {
    pending.set(podcastId, entry);
    return;
  }

  pending.delete(podcastId);
  const podcast = await findPodcastById(podcastId);
  if (podcast) void notifyPodcastCompressionFailed(podcast);
  await finalizeFromPending(podcastId, entry);
};

export const completePodcastAudioCompression = async (
  podcastId: string,
  result: CompressionResult,
  compressedUrl: string,
): Promise<void> => {
  await completeJob(podcastId, 'audio', result, compressedUrl);
};

export const completePodcastVideoCompression = async (
  podcastId: string,
  result: CompressionResult,
  compressedUrl: string,
): Promise<void> => {
  await completeJob(podcastId, 'video', result, compressedUrl);
};

export const failPodcastCompressionJob = async (podcastId: string): Promise<void> => {
  await failJob(podcastId);
};
