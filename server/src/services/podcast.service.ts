import fs from 'fs';
import path from 'path';
import {
  clearPodcastCompressionJobs,
  completePodcastAudioCompression,
  completePodcastVideoCompression,
  failPodcastCompressionJob,
  registerPodcastCompressionJobs,
} from '../compression/compressionJobs';
import { compressAudio, compressImage, compressVideo } from '../compression/compress';
import { getMediaDurationSeconds } from '../compression/ffprobe';
import { extractAudioFromVideo } from '../compression/extractAudio';
import {
  clearCompressionProgress,
  initCompressionProgress,
  markCompressionComplete,
  readCompressionProgress,
  setCompressionProgress,
  type PodcastCompressionProgress,
} from '../compression/progressStore';
import { AppError } from '../middleware/errorHandler';
import {
  deletePodcastAndReturnPath,
  findPodcastById,
  findPublicPodcastById,
  insertPodcast,
  listPodcasts,
  listPublicPodcasts,
  updatePodcastById,
  type Podcast,
  type PodcastListQuery,
  type PaginatedPodcasts,
  type PublicPodcast,
} from '../models/podcast.model';
import type { CreatePodcastInput, UpdatePodcastInput } from '../validations/podcast.validation';
import { formatFromMediaPath, roundDurationSeconds } from '../utils/mediaFormat';
import { notifyPodcastPublished } from './adminNotification.service';

export const getPodcasts = async (
  opts: PodcastListQuery = {},
): Promise<PaginatedPodcasts<Podcast>> => listPodcasts(opts);

export const getPublicPodcasts = async (
  opts: PodcastListQuery = {},
): Promise<PaginatedPodcasts<PublicPodcast>> => listPublicPodcasts(opts);

export const getPublicPodcastById = async (id: string): Promise<PublicPodcast> => {
  const podcast = await findPublicPodcastById(id);
  if (!podcast) throw new AppError('Podcast não encontrado', 404);
  return podcast;
};

export const getPodcastById = async (id: string): Promise<Podcast> => {
  const podcast = await findPodcastById(id);
  if (!podcast) throw new AppError('Podcast não encontrado', 404);
  return podcast;
};

export const getPodcastCompressionProgress = async (
  id: string,
): Promise<PodcastCompressionProgress | null> => {
  await getPodcastById(id);
  return readCompressionProgress(id);
};

export const createPodcast = async (
  input: CreatePodcastInput,
  userId: string,
  files: {
    audio?: Express.Multer.File;
    video?: Express.Multer.File;
    cover?: Express.Multer.File;
  },
  authorCert?: { fingerprint: string; cn: string } | null,
): Promise<Podcast> => {
  if (!files.audio && !files.video) {
    throw new AppError('Ficheiro de áudio ou vídeo é obrigatório', 400);
  }

  let audio_url: string | null = null;
  let video_url: string | null = null;
  let original_size = 0;
  let audioPhysicalPath: string | null = null;
  let videoPhysicalPath: string | null = null;

  if (files.video) {
    video_url = `/uploads/video/${files.video.filename}`;
    original_size += files.video.size;
    videoPhysicalPath = path.join(process.cwd(), video_url);
  }

  if (files.audio) {
    audio_url = `/uploads/audio/${files.audio.filename}`;
    original_size += files.audio.size;
    audioPhysicalPath = path.join(process.cwd(), audio_url);
  } else if (files.video) {
    const extractedPath = await extractAudioFromVideo(videoPhysicalPath!);
    const extractedName = path.basename(extractedPath);
    audio_url = `/uploads/audio/${extractedName}`;
    audioPhysicalPath = extractedPath;
    original_size += fs.statSync(extractedPath).size;
  }

  const cover_url = files.cover ? `/uploads/covers/${files.cover.filename}` : null;

  const probePath = audioPhysicalPath ?? videoPhysicalPath;
  const durationRaw = probePath ? await getMediaDurationSeconds(probePath) : null;
  const duration_seconds = roundDurationSeconds(durationRaw);
  const primaryName = files.audio?.filename ?? files.video?.filename ?? '';
  const media_format = primaryName ? formatFromMediaPath(primaryName) : null;

  const podcast = await insertPodcast({
    title: input.title,
    description: input.description,
    category_id: input.category_id,
    audio_url,
    video_url,
    cover_url,
    original_size,
    duration_seconds,
    media_format,
    user_id: userId,
    author_cert_fingerprint: authorCert?.fingerprint ?? null,
    author_cert_cn: authorCert?.cn ?? null,
  });

  const compressionJobs =
    (audioPhysicalPath ? 1 : 0) + (videoPhysicalPath ? 1 : 0);
  if (compressionJobs > 0) {
    registerPodcastCompressionJobs(podcast.id, compressionJobs, original_size);
  }

  if (audioPhysicalPath) {
    void runAudioCompression(podcast.id, audioPhysicalPath);
  }

  if (videoPhysicalPath) {
    void runVideoCompression(podcast.id, videoPhysicalPath, 'h264');
  }

  if (files.cover) {
    const physicalCoverPath = path.join(process.cwd(), `/uploads/covers/${files.cover.filename}`);
    void runImageCompression('capa', physicalCoverPath);
  }

  void notifyPodcastPublished(podcast);

  return podcast;
};

const runImageCompression = async (label: string, inputPath: string): Promise<void> => {
  try {
    console.log(`[CAMPUS] Compressão de imagem iniciada: ${label}`);
    const result = await compressImage(inputPath);
    console.log(
      `[CAMPUS] Imagem comprimida: ${label} | ` +
        `${result.originalSize} → ${result.compressedSize} bytes | ` +
        `${result.compressionRatio}% redução`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CAMPUS] Compressão de imagem falhou (${label}): ${msg}`);
  }
};

const runVideoCompression = async (
  podcastId: string,
  inputPath: string,
  codec: 'h264' | 'h265' | 'vp9',
): Promise<void> => {
  initCompressionProgress(podcastId, 'video');
  try {
    console.log(`[CAMPUS] Compressão de vídeo iniciada (${codec}): ${podcastId}`);
    const result = await compressVideo(inputPath, codec, {
      onProgress: (percent) => setCompressionProgress(podcastId, 'video', percent),
    });

    const ext = codec === 'vp9' ? '.webm' : '.mp4';
    const compressedUrl = `/uploads/video/compressed/${path.basename(result.outputPath, path.extname(result.outputPath))}${ext}`;

    await completePodcastVideoCompression(podcastId, result, compressedUrl);

    console.log(
      `[CAMPUS] Vídeo comprimido (${codec}): ${podcastId} | ` +
      `${result.originalSize} → ${result.compressedSize} bytes | ` +
      `${result.compressionRatio}% redução | ${result.processingTimeMs}ms`,
    );
    markCompressionComplete(podcastId, 'video');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CAMPUS] Compressão de vídeo falhou para ${podcastId}: ${msg}`);
    await failPodcastCompressionJob(podcastId);
  }
};

const runAudioCompression = async (podcastId: string, inputPath: string): Promise<void> => {
  initCompressionProgress(podcastId, 'audio');
  try {
    console.log(`[CAMPUS] Compressão iniciada: ${podcastId}`);
    const result = await compressAudio(inputPath, {
      onProgress: (percent) => setCompressionProgress(podcastId, 'audio', percent),
    });
    const compressedUrl = `/uploads/audio/compressed/${path.basename(result.outputPath)}`;

    await completePodcastAudioCompression(podcastId, result, compressedUrl);

    console.log(
      `[CAMPUS] Compressão concluída: ${podcastId} | ` +
      `${result.originalSize} → ${result.compressedSize} bytes | ` +
      `${result.compressionRatio}% redução | ${result.processingTimeMs}ms`,
    );
    markCompressionComplete(podcastId, 'audio');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CAMPUS] Compressão falhou para ${podcastId}: ${msg}`);
    await failPodcastCompressionJob(podcastId);
  }
};

const AUDIO_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.webm': 'audio/webm',
};

const VIDEO_MIME: Record<string, string> = {
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.ogg': 'video/ogg',
};

export type PodcastDownloadMedia = 'audio' | 'video';

const resolveUploadPath = (urlPath: string): string =>
  path.join(process.cwd(), urlPath.replace(/^\/+/, ''));

const sanitizeDownloadName = (title: string, ext: string): string => {
  const base =
    title
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'podcast';
  return `${base}${ext}`;
};

export interface PodcastDownloadInfo {
  filePath: string;
  downloadName: string;
  contentType: string;
  title: string;
}

export const getPodcastDownload = async (
  id: string,
  media: PodcastDownloadMedia = 'audio',
): Promise<PodcastDownloadInfo> => {
  const podcast = await getPodcastById(id);

  if (podcast.compressed_size == null) {
    throw new AppError('Este episódio ainda está a ser processado. Tenta mais tarde.', 409);
  }

  const urlPath = media === 'video' ? podcast.video_url : podcast.audio_url;
  if (!urlPath) {
    throw new AppError(
      media === 'video'
        ? 'Este episódio não tem ficheiro de vídeo para download'
        : 'Este podcast ainda não tem ficheiro de áudio',
      404,
    );
  }

  const filePath = resolveUploadPath(urlPath);
  if (!fs.existsSync(filePath)) {
    throw new AppError('Ficheiro do episódio não encontrado no servidor', 404);
  }

  const ext = path.extname(filePath).toLowerCase() || (media === 'video' ? '.mp4' : '.mp3');
  const mimeMap = media === 'video' ? VIDEO_MIME : AUDIO_MIME;

  return {
    filePath,
    downloadName: sanitizeDownloadName(podcast.title, ext),
    contentType: mimeMap[ext] ?? 'application/octet-stream',
    title: podcast.title,
  };
};

export const updatePodcast = async (
  id: string,
  userId: string,
  input: UpdatePodcastInput,
): Promise<Podcast> => {
  const existing = await findPodcastById(id);
  if (!existing) throw new AppError('Podcast não encontrado', 404);
  if (existing.user_id !== userId) {
    throw new AppError('Sem permissão para editar este podcast', 403);
  }

  const updated = await updatePodcastById(id, input);
  if (!updated) throw new AppError('Nada para actualizar', 400);

  const podcast = await findPodcastById(id);
  if (!podcast) throw new AppError('Podcast não encontrado', 404);
  return podcast;
};

export const deletePodcast = async (id: string, userId: string): Promise<void> => {
  const result = await deletePodcastAndReturnPath(id, userId);

  if (!result) {
    throw new AppError('Podcast não encontrado ou sem permissão para eliminar', 404);
  }

  clearCompressionProgress(id);
  clearPodcastCompressionJobs(id);

  for (const urlField of [result.audio_url, result.video_url, result.cover_url]) {
    if (!urlField) continue;
    const filePath = path.join(process.cwd(), urlField);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};
