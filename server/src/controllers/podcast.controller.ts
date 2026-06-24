import type { Request, Response } from 'express';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';
import * as podcastService from '../services/podcast.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  validateCreatePodcast,
  validateUpdatePodcast,
} from '../validations/podcast.validation';

// ─── GET /api/podcasts ────────────────────────────────────────────────────────

export const getAll = async (req: Request, res: Response): Promise<void> => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const rawCat = req.query.category_id;
  const category_id =
    typeof rawCat === 'string' && rawCat ? Number(rawCat) : undefined;

  const podcasts = await podcastService.getPodcasts({ search, category_id });
  sendSuccess(res, { podcasts });
};

// ─── GET /api/podcasts/:id ────────────────────────────────────────────────────

export const getOne = async (req: Request, res: Response): Promise<void> => {
  const podcast = await podcastService.getPodcastById(req.params.id as string);
  sendSuccess(res, { podcast });
};

// ─── GET /api/podcasts/:id/compression-progress ───────────────────────────────

export const getCompressionProgress = async (req: Request, res: Response): Promise<void> => {
  const progress = await podcastService.getPodcastCompressionProgress(req.params.id as string);
  sendSuccess(res, { progress });
};

// ─── GET /api/podcasts/:id/download ───────────────────────────────────────────

export const download = async (req: Request, res: Response): Promise<void> => {
  const { filePath, downloadName, contentType } = await podcastService.getPodcastDownload(
    req.params.id as string,
  );

  const stat = fs.statSync(filePath);

  res.status(200).set({
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${downloadName}"`,
    'Content-Length': String(stat.size),
  });

  fs.createReadStream(filePath).pipe(res);
};

// ─── POST /api/podcasts ───────────────────────────────────────────────────────

export const create = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Autenticação necessária', 401);

  const input = validateCreatePodcast(req.body);

  // Ficheiros vindos do multer (.fields)
  const multerFiles = req.files as
    | Record<string, Express.Multer.File[]>
    | undefined;

  const files = {
    audio: multerFiles?.['audio']?.[0],
    video: multerFiles?.['video']?.[0],
    cover: multerFiles?.['cover']?.[0],
  };

  const podcast = await podcastService.createPodcast(input, userId, files);
  sendSuccess(res, { podcast }, 'Podcast publicado com sucesso', 201);
};

// ─── PATCH /api/podcasts/:id ──────────────────────────────────────────────────

export const update = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Autenticação necessária', 401);

  const input = validateUpdatePodcast(req.body);
  if (Object.keys(input).length === 0) {
    throw new AppError('Nada para actualizar', 400);
  }

  const isAdmin = req.user?.role === 'admin';
  const podcast = await podcastService.updatePodcast(
    req.params.id as string,
    userId,
    isAdmin,
    input,
  );
  sendSuccess(res, { podcast }, 'Podcast actualizado com sucesso');
};

// ─── DELETE /api/podcasts/:id ─────────────────────────────────────────────────

export const remove = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Autenticação necessária', 401);

  const isAdmin = req.user?.role === 'admin';

  await podcastService.deletePodcast(req.params.id as string, userId, isAdmin);
  sendSuccess(res, null, 'Podcast eliminado com sucesso');
};
