import fs from 'fs';
import path from 'path';
import { compressAudio } from '../compression/compress';
import { extractAudioFromVideo } from '../compression/extractAudio';
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

// ─── Listar ───────────────────────────────────────────────────────────────────

export const getPodcasts = async (opts?: {
  search?: string;
  category_id?: number;
}): Promise<Podcast[]> => {
  return listPodcasts(opts);
};

// ─── Detalhe ──────────────────────────────────────────────────────────────────

export const getPodcastById = async (id: string): Promise<Podcast> => {
  const podcast = await findPodcastById(id);
  if (!podcast) throw new AppError('Podcast não encontrado', 404);
  return podcast;
};

// ─── Criar ────────────────────────────────────────────────────────────────────

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

  let audio_url: string | null = null;
  let video_url: string | null = null;
  let original_size = 0;
  let audioPhysicalPath: string | null = null;

  if (files.video) {
    video_url = `/uploads/videos/${files.video.filename}`;
    original_size += files.video.size;
  }

  if (files.audio) {
    audio_url = `/uploads/audio/${files.audio.filename}`;
    original_size += files.audio.size;
    audioPhysicalPath = path.join(process.cwd(), audio_url);
  } else if (files.video) {
    const videoPath = path.join(process.cwd(), video_url!);
    const extractedPath = await extractAudioFromVideo(videoPath);
    const extractedName = path.basename(extractedPath);
    audio_url = `/uploads/audio/${extractedName}`;
    audioPhysicalPath = extractedPath;
    original_size += fs.statSync(extractedPath).size;
  }

  const cover_url = files.cover ? `/uploads/covers/${files.cover.filename}` : null;

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

  if (audioPhysicalPath) {
    void runCompression(podcast.id, audioPhysicalPath);
  }

  return podcast;
};

const runCompression = async (podcastId: string, inputPath: string): Promise<void> => {
  try {
    console.log(`[CAMPUS] Compressão iniciada: ${podcastId}`);
    const result = await compressAudio(inputPath);

    // audio_url comprimido: /uploads/audio/compressed/filename.mp3
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

// ─── Eliminar ─────────────────────────────────────────────────────────────────

export const deletePodcast = async (
  id: string,
  userId: string,
  isAdmin: boolean,
): Promise<void> => {
  const result = await deletePodcastAndReturnPath(id, userId, isAdmin);

  if (!result) {
    throw new AppError('Podcast não encontrado ou sem permissão para eliminar', 404);
  }

  // Apagar ficheiros físicos do disco
  for (const urlField of [result.audio_url, result.video_url, result.cover_url]) {
    if (!urlField) continue;
    // urlField = "/uploads/audio/filename.mp3" → caminho relativo ao processo
    const filePath = path.join(process.cwd(), urlField);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};
