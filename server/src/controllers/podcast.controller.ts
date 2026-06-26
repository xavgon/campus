import type { Request, Response } from 'express';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';
import * as podcastService from '../services/podcast.service';
import { recordDownload } from '../models/download.model';
import { insertLog } from '../models/log.model';
import { sendSuccess } from '../utils/apiResponse';
import {
  validateCreatePodcast,
  validateUpdatePodcast,
} from '../validations/podcast.validation';
import type { PodcastSort } from '../models/podcast.model';

const VALID_SORTS: PodcastSort[] = ['newest', 'oldest', 'title-asc', 'title-desc'];

const parseListQuery = (req: Request) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const rawCat = req.query.category_id;
  const category_id =
    typeof rawCat === 'string' && rawCat ? Number(rawCat) : undefined;
  const page = typeof req.query.page === 'string' ? Number(req.query.page) : undefined;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
  const rawSort = typeof req.query.sort === 'string' ? req.query.sort : undefined;
  const sort = VALID_SORTS.includes(rawSort as PodcastSort)
    ? (rawSort as PodcastSort)
    : undefined;

  return { search, category_id, page, limit, sort };
};

const toPaginationMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

// ─── GET /api/podcasts ────────────────────────────────────────────────────────

export const getAll = async (req: Request, res: Response): Promise<void> => {
  const result = await podcastService.getPodcasts(parseListQuery(req));
  sendSuccess(res, {
    podcasts: result.items,
    pagination: toPaginationMeta(result.page, result.limit, result.total),
    summary: result.summary,
  });
};

// ─── GET /api/podcasts/public — catálogo sem autenticação (RF09) ──────────────

export const getPublic = async (req: Request, res: Response): Promise<void> => {
  const result = await podcastService.getPublicPodcasts(parseListQuery(req));
  sendSuccess(res, {
    podcasts: result.items,
    pagination: toPaginationMeta(result.page, result.limit, result.total),
  });
};

// ─── GET /api/podcasts/public/:id — detalhe público (RF10) ────────────────────

export const getPublicOne = async (req: Request, res: Response): Promise<void> => {
  const podcast = await podcastService.getPublicPodcastById(req.params.id as string);
  sendSuccess(res, { podcast });
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
  const podcastId = req.params.id as string;
  const media = req.query.media === 'video' ? 'video' : 'audio';
  const { filePath, downloadName, contentType, title } =
    await podcastService.getPodcastDownload(podcastId, media);

  // Task 5 — Protecção contra pirataria: registar identidade do dispositivo que descarregou
  const ip = (req.ip ?? req.socket?.remoteAddress ?? '').replace(/^::ffff:/, '');
  await recordDownload(
    podcastId,
    req.user?.userId ?? null,
    req.clientCert?.fingerprint ?? null,
    req.clientCert?.cn ?? null,
    ip || null,
  );

  // Task 3 — Não repúdio: log assinado da acção de download
  await insertLog(
    req.user?.userId ?? null,
    `Download: ${title}`,
    req.clientCert ?? null,
  );

  const stat = fs.statSync(filePath);

  res.status(200).set({
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${downloadName}"`,
    'Content-Length': String(stat.size),
    'Cache-Control': 'private, no-store',
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

  const podcast = await podcastService.createPodcast(input, userId, files, req.clientCert ?? null);

  // Task 3 — Não repúdio: log assinado da publicação
  await insertLog(userId, `Publicou: ${podcast.title}`, req.clientCert ?? null);

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

  const podcast = await podcastService.updatePodcast(
    req.params.id as string,
    userId,
    input,
  );
  await insertLog(userId, `Podcast actualizado: ${podcast.title}`, req.clientCert ?? null);
  sendSuccess(res, { podcast }, 'Podcast actualizado com sucesso');
};

// ─── DELETE /api/podcasts/:id ─────────────────────────────────────────────────

export const remove = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Autenticação necessária', 401);

  const podcastId = req.params.id as string;
  const existing = await podcastService.getPodcastById(podcastId);

  await podcastService.deletePodcast(podcastId, userId);
  await insertLog(userId, `Podcast eliminado: ${existing.title}`, req.clientCert ?? null);
  sendSuccess(res, null, 'Podcast eliminado com sucesso');
};
