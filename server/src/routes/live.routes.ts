import path from 'path';
import { Router, Request, Response } from 'express';
import { getActiveSessions } from '../live/live.gateway';
import { getCompletedRecordings, getRecordingById } from '../live/live.recorder';
import { AppError } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { requireCreator } from '../middleware/requireCreator';
import { asyncHandler } from '../middleware/asyncHandler';
import { listScheduledStreamsForHost, findStreamById } from '../models/stream.model';
import { listLiveCommentsForStream } from '../models/liveComment.model';
import { toCommentWire } from '../live/live.comments';
import { sendSuccess } from '../utils/apiResponse';

export const liveRouter = Router();

// GET /api/live — transmissões activas (BD + ouvintes WS em memória)
liveRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const sessions = await getActiveSessions();
    sendSuccess(res, { sessions, total: sessions.length });
  }),
);

// GET /api/live/scheduled — transmissões agendadas do criador actual
liveRouter.get(
  '/scheduled',
  requireAuth,
  requireCreator,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Autenticação necessária', 401);

    const streams = await listScheduledStreamsForHost(userId);
    sendSuccess(res, { streams, total: streams.length });
  }),
);

// GET /api/live/:streamId/comments — histórico de comentários da transmissão
liveRouter.get(
  '/:streamId/comments',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const streamId = req.params.streamId as string;
    const stream = await findStreamById(streamId);
    if (!stream) throw new AppError('Transmissão não encontrada', 404);

    const comments = await listLiveCommentsForStream(streamId);
    const hostId = stream.host_user_id ?? '';
    sendSuccess(res, {
      comments: comments.map((row) => toCommentWire(row, hostId)),
      total: comments.length,
    });
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
