import fs from 'fs';
import path from 'path';
import { compressAudio, compressImage, compressVideo } from '../compression/compress';
import { AppError } from '../middleware/errorHandler';
import {
  deletePodcastAndReturnPath,
  findPodcastById,
  insertPodcast,
  listPodcasts,
  updatePodcastCompression,
  type Podcast,
} from '../models/podcast.model';
import type { CreatePodcastInput } from '../validations/podcast.validation';

export const getPodcasts = async (opts?: {
  search?: string;
  category_id?: number;
}): Promise<Podcast[]> => listPodcasts(opts);

export const getPodcastById = async (id: string): Promise<Podcast> => {
  const podcast = await findPodcastById(id);
  if (!podcast) throw new AppError('Podcast não encontrado', 404);
  return podcast;
};

export const createPodcast = async (
  input: CreatePodcastInput,
  userId: string,
  files: {
    audio?: Express.Multer.File;
    video?: Express.Multer.File;
    cover?: Express.Multer.File;
  },
): Promise<Podcast> => {
  if (!files.audio && !files.video) {
    throw new AppError('Ficheiro de áudio ou vídeo é obrigatório', 400);
  }

  const mediaFile = files.audio ?? files.video!;
  const mediaFolder = files.audio ? 'audio' : 'video';
  const audio_url = `/uploads/${mediaFolder}/${mediaFile.filename}`;
  const cover_url = files.cover ? `/uploads/covers/${files.cover.filename}` : null;
  const original_size = mediaFile.size;

  const podcast = await insertPodcast({
    title: input.title,
    description: input.description,
    category_id: input.category_id,
    audio_url,
    video_url,
    cover_url,
    original_size,
    user_id: userId,
  });

  // Compressão assíncrona — não bloqueia a resposta HTTP
  const physicalMediaPath = path.join(process.cwd(), audio_url);
  if (files.audio) {
    void runAudioCompression(podcast.id, physicalMediaPath);
  } else if (files.video) {
    // Comprime com H.264 por defeito (melhor compatibilidade)
    void runVideoCompression(podcast.id, physicalMediaPath, 'h264');
  }

  if (files.cover) {
    const physicalCoverPath = path.join(process.cwd(), `/uploads/covers/${files.cover.filename}`);
    void runImageCompression('capa', physicalCoverPath);
  }

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
  try {
    console.log(`[CAMPUS] Compressão de vídeo iniciada (${codec}): ${podcastId}`);
    const result = await compressVideo(inputPath, codec);

    const ext = codec === 'vp9' ? '.webm' : '.mp4';
    const compressedUrl = `/uploads/video/compressed/${path.basename(result.outputPath, path.extname(result.outputPath))}${ext}`;

    await updatePodcastCompression(podcastId, result.compressedSize, result.compressionRatio, compressedUrl);

    console.log(
      `[CAMPUS] Vídeo comprimido (${codec}): ${podcastId} | ` +
      `${result.originalSize} → ${result.compressedSize} bytes | ` +
      `${result.compressionRatio}% redução`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CAMPUS] Compressão de vídeo falhou para ${podcastId}: ${msg}`);
  }
};

const runAudioCompression = async (podcastId: string, inputPath: string): Promise<void> => {
  try {
    console.log(`[CAMPUS] Compressão iniciada: ${podcastId}`);
    const result = await compressAudio(inputPath);
    const compressedUrl = `/uploads/audio/compressed/${path.basename(result.outputPath)}`;

    await updatePodcastCompression(
      podcastId,
      result.compressedSize,
      result.compressionRatio,
      compressedUrl,
    );

    console.log(
      `[CAMPUS] Compressão concluída: ${podcastId} | ` +
        `${result.originalSize} → ${result.compressedSize} bytes | ` +
        `${result.compressionRatio}% redução`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[CAMPUS] Compressão falhou para ${podcastId}: ${msg}`);
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
}

export const getPodcastDownload = async (id: string): Promise<PodcastDownloadInfo> => {
  const podcast = await getPodcastById(id);
  if (!podcast.audio_url) {
    throw new AppError('Este podcast ainda não tem ficheiro de áudio', 404);
  }

  const filePath = resolveUploadPath(podcast.audio_url);
  if (!fs.existsSync(filePath)) {
    throw new AppError('Ficheiro de áudio não encontrado no servidor', 404);
  }

  const ext = path.extname(filePath).toLowerCase() || '.mp3';
  return {
    filePath,
    downloadName: sanitizeDownloadName(podcast.title, ext),
    contentType: AUDIO_MIME[ext] ?? 'application/octet-stream',
  };
};

export const deletePodcast = async (
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<void> => {
  const result = await deletePodcastAndReturnPath(id, userId, isAdmin);

  if (!result) {
    throw new AppError('Podcast não encontrado ou sem permissão para eliminar', 404);
  }

  for (const urlField of [result.audio_url, result.video_url, result.cover_url]) {
    if (!urlField) continue;
    const filePath = path.join(process.cwd(), urlField);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};
