import { Router } from 'express';
import * as podcastController from '../controllers/podcast.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadPodcast } from '../middleware/upload.middleware';

export const podcastRouter = Router();

// Listagem e detalhe — qualquer utilizador autenticado
podcastRouter.get('/', requireAuth, asyncHandler(podcastController.getAll));
podcastRouter.get('/:id', requireAuth, asyncHandler(podcastController.getOne));

// Publicar — autenticado + upload de ficheiros
podcastRouter.post(
  '/',
  requireAuth,
  uploadPodcast,
  asyncHandler(podcastController.create),
);

// Eliminar — dono do podcast ou admin
podcastRouter.delete('/:id', requireAuth, asyncHandler(podcastController.remove));
