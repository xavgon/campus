import fs from 'fs';
import path from 'path';
import { AppError } from '../middleware/errorHandler';
import {
  deletePodcastAndReturnPath,
  findPodcastById,
  insertPodcast,
  listPodcasts,
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

  return insertPodcast({
    title: input.title,
    description: input.description,
    category_id: input.category_id,
    audio_url,
    cover_url,
    original_size,
    user_id: userId,
  });
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
