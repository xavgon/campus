import { Router } from 'express';
import * as podcastController from '../controllers/podcast.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { requireCreator } from '../middleware/requireCreator';
import { uploadPodcast } from '../middleware/upload.middleware';

export const podcastRouter = Router();

// Listagem e detalhe — qualquer utilizador autenticado
podcastRouter.get('/', requireAuth, asyncHandler(podcastController.getAll));
podcastRouter.get('/:id/download', requireAuth, asyncHandler(podcastController.download));
podcastRouter.get('/:id', requireAuth, asyncHandler(podcastController.getOne));

// Publicar — criador ou admin + upload de ficheiros
podcastRouter.post(
  '/',
  requireAuth,
  requireCreator,
  uploadPodcast,
  asyncHandler(podcastController.create),
);

// Eliminar — dono do podcast ou admin
podcastRouter.delete('/:id', requireAuth, asyncHandler(podcastController.remove));
