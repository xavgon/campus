import path from 'path';
import { Router, Request, Response } from 'express';
import { getActiveSessions } from '../live/live.gateway';
import { getCompletedRecordings, getRecordingById } from '../live/live.recorder';
import { AppError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const liveRouter = Router();

// GET /api/live — lives activas
liveRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const sessions = getActiveSessions();
    sendSuccess(res, { sessions, total: sessions.length });
  }),
);

// GET /api/live/recordings — gravações concluídas
liveRouter.get(
  '/recordings',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const recordings = getCompletedRecordings();
    sendSuccess(res, { recordings, total: recordings.length });
  }),
);

// GET /api/live/recordings/:id/audio — download do áudio gravado
liveRouter.get(
  '/recordings/:id/audio',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const rec = getRecordingById(id);
    if (!rec || !rec.audioFile) throw new AppError('Gravação de áudio não encontrada', 404);

    const filePath = path.join(__dirname, '..', '..', rec.audioFile);
    res.download(filePath, `${rec.title}.mp3`);
  }),
);

// GET /api/live/recordings/:id/video — download do vídeo gravado
liveRouter.get(
  '/recordings/:id/video',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const rec = getRecordingById(id);
    if (!rec || !rec.videoFile) throw new AppError('Gravação de vídeo não encontrada', 404);

    const filePath = path.join(__dirname, '..', '..', rec.videoFile);
    res.download(filePath, `${rec.title}.mp4`);
  }),
);
