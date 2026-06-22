import { Router, Request, Response } from 'express';
import { getActiveSessions } from '../live/live.gateway';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const liveRouter = Router();

// GET /api/live — lista todas as transmissões activas
liveRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const sessions = getActiveSessions();
    sendSuccess(res, { sessions, total: sessions.length });
  }),
);
