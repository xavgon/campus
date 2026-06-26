import fs from 'fs';
import path from 'path';
import { getRecordingById } from '../live/live.recorder';
import { insertLog } from '../models/log.model';
import { findPodcastById, insertPodcast, markPodcastStreamReady } from '../models/podcast.model';
import { findStreamById } from '../models/stream.model';
import { AppError } from '../middleware/errorHandler';
import type { CreatePodcastInput } from '../validations/podcast.validation';
import type { ClientCertInfo } from '../models/log.model';

const copyToUploads = (srcRelative: string, destRelative: string): number => {
  const src = path.join(process.cwd(), srcRelative);
  const dest = path.join(process.cwd(), destRelative);
  if (!fs.existsSync(src)) {
    throw new AppError('Ficheiro de gravação não encontrado no servidor', 404);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return fs.statSync(dest).size;
};

/** RF07 — Publica gravação FFmpeg do live como episódio VOD na biblioteca. */
export const publishServerRecordingAsPodcast = async (
  recordingId: string,
  userId: string,
  input: CreatePodcastInput,
  clientCert?: ClientCertInfo | null,
) => {
  const recording = getRecordingById(recordingId);
  if (!recording) throw new AppError('Gravação não encontrada', 404);
  if (recording.publishedPodcastId) {
    throw new AppError('Esta gravação já foi publicada como episódio', 409);
  }
  if (!recording.audioFile) {
    throw new AppError('Gravação sem áudio para publicar', 400);
  }

  const stream = await findStreamById(recordingId);
  if (!stream) throw new AppError('Transmissão associada não encontrada', 404);
  if (stream.host_user_id !== userId) {
    throw new AppError('Sem permissão para publicar esta gravação', 403);
  }

  const stamp = Date.now();
  const audioUrl = `/uploads/audio/vod-live-${recordingId}-${stamp}.mp3`;
  let originalSize = copyToUploads(recording.audioFile, audioUrl.slice(1));

  let videoUrl: string | null = null;
  if (recording.videoFile) {
    videoUrl = `/uploads/video/vod-live-${recordingId}-${stamp}.mp4`;
    try {
      originalSize += copyToUploads(recording.videoFile, videoUrl.slice(1));
    } catch {
      videoUrl = null;
    }
  }

  const podcast = await insertPodcast({
    title: input.title,
    description: input.description,
    category_id: input.category_id,
    audio_url: audioUrl,
    video_url: videoUrl,
    cover_url: null,
    original_size: originalSize,
    duration_seconds:
      recording.durationSeconds > 0 ? Math.max(1, recording.durationSeconds) : null,
    media_format: 'mp3',
    user_id: userId,
    author_cert_fingerprint: clientCert?.fingerprint ?? null,
    author_cert_cn: clientCert?.cn ?? null,
  });

  const audioSize = fs.statSync(path.join(process.cwd(), audioUrl.slice(1))).size;
  const ratio =
    originalSize > 0 ? Math.round((1 - audioSize / originalSize) * 10000) / 100 : 0;
  await markPodcastStreamReady(podcast.id, audioSize, Math.max(0, ratio));

  recording.publishedPodcastId = podcast.id;

  await insertLog(userId, `VOD live publicado: ${input.title}`, clientCert ?? null);

  const full = await findPodcastById(podcast.id);
  if (!full) throw new AppError('Erro ao publicar episódio VOD', 500);
  return full;
};
