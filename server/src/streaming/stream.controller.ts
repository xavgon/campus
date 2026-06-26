import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { findPodcastById } from '../models/podcast.model';

// ─── Mapa de extensão → MIME type ─────────────────────────────────────────────

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

const resolvePodcastFile = (urlPath: string): string =>
  path.join(__dirname, '..', '..', urlPath);

const streamFileWithRange = (
  req: Request,
  res: Response,
  filePath: string,
  contentType: string,
): void => {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const rangeHeader = req.headers.range;

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      return;
    }

    const chunkSize = end - start + 1;

    res.status(206).set({
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': String(chunkSize),
      'Content-Type': contentType,
      'Cache-Control': 'private, no-transform',
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.status(200).set({
    'Content-Length': String(fileSize),
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-transform',
  });

  fs.createReadStream(filePath).pipe(res);
};

// ─── GET /api/stream/:id ──────────────────────────────────────────────────────

export const streamAudio = async (req: Request, res: Response): Promise<void> => {
  const podcast = await findPodcastById(req.params.id as string);
  if (!podcast) throw new AppError('Podcast não encontrado', 404);

  if (!podcast.audio_url) {
    throw new AppError('Este podcast ainda não tem ficheiro de áudio', 404);
  }

  const filePath = resolvePodcastFile(podcast.audio_url);

  if (!fs.existsSync(filePath)) {
    throw new AppError('Ficheiro de áudio não encontrado no servidor', 404);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = AUDIO_MIME[ext] ?? 'audio/mpeg';
  streamFileWithRange(req, res, filePath, contentType);
};

// ─── GET /api/stream/:id/video ────────────────────────────────────────────────

export const streamVideo = async (req: Request, res: Response): Promise<void> => {
  const podcast = await findPodcastById(req.params.id as string);
  if (!podcast) throw new AppError('Podcast não encontrado', 404);

  if (!podcast.video_url) {
    throw new AppError('Este episódio não tem vídeo', 404);
  }

  const filePath = resolvePodcastFile(podcast.video_url);

  if (!fs.existsSync(filePath)) {
    throw new AppError('Ficheiro de vídeo não encontrado no servidor', 404);
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = VIDEO_MIME[ext] ?? 'video/webm';
  streamFileWithRange(req, res, filePath, contentType);
};
