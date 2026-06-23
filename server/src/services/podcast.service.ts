import fs from 'fs';
import path from 'path';
import { compressAudio, compressImage } from '../compression/compress';
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
    cover?: Express.Multer.File;
  },
): Promise<Podcast> => {
  if (!files.audio) {
    throw new AppError('Ficheiro de áudio é obrigatório', 400);
  }

  const audio_url = `/uploads/audio/${files.audio.filename}`;
  const cover_url = files.cover ? `/uploads/covers/${files.cover.filename}` : null;
  const original_size = files.audio.size;

  const podcast = await insertPodcast({
    title: input.title,
    description: input.description,
    category_id: input.category_id,
    audio_url,
    cover_url,
    original_size,
    user_id: userId,
  });

  // Compressão assíncrona — não bloqueia a resposta HTTP
  const physicalAudioPath = path.join(process.cwd(), audio_url);
  void runAudioCompression(podcast.id, physicalAudioPath);

  // Compressão da capa (imagem), se existir
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

const runAudioCompression = async (podcastId: string, inputPath: string): Promise<void> => {
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
  for (const urlField of [result.audio_url, result.cover_url]) {
    if (!urlField) continue;
    // urlField = "/uploads/audio/filename.mp3" → caminho relativo ao processo
    const filePath = path.join(process.cwd(), urlField);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};
