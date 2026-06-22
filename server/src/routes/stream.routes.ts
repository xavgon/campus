import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireStreamAuth } from '../middleware/streamAuth.middleware';
import { streamAudio, streamVideo } from '../streaming/stream.controller';

export const streamRouter = Router();

// GET /api/stream/:id/video — vídeo com áudio (episódios live)
streamRouter.get('/:id/video', requireStreamAuth, asyncHandler(streamVideo));
// GET /api/stream/:id  — aceita token via header OU via ?token= (player <audio>)
streamRouter.get('/:id', requireStreamAuth, asyncHandler(streamAudio));
