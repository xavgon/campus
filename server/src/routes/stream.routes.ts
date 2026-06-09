import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { streamAudio } from '../streaming/stream.controller';

export const streamRouter = Router();

// GET /api/stream/:id — requer autenticação, suporta Range requests
streamRouter.get('/:id', requireAuth, asyncHandler(streamAudio));
