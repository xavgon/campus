import { Router } from 'express';
import * as presenceController from '../controllers/presence.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';

export const presenceRouter = Router();

presenceRouter.post('/heartbeat', requireAuth, asyncHandler(presenceController.heartbeat));
presenceRouter.post('/leave', requireAuth, asyncHandler(presenceController.leave));
presenceRouter.get('/online', requireAuth, asyncHandler(presenceController.getOnline));
