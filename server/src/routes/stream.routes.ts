import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireStreamAuth } from '../middleware/streamAuth.middleware';
import { streamAudio } from '../streaming/stream.controller';

export const streamRouter = Router();

// GET /api/stream/:id  — aceita token via header OU via ?token= (player <audio>)
streamRouter.get('/:id', requireStreamAuth, asyncHandler(streamAudio));
