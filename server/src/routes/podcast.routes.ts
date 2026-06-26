import { Router } from 'express';
import * as podcastController from '../controllers/podcast.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { requireCreator } from '../middleware/requireCreator';
import { requireDeviceCertificate } from '../middleware/requireDeviceCertificate';
import { uploadPodcast } from '../middleware/upload.middleware';

export const podcastRouter = Router();

// Catálogo público — sem autenticação (RF09); tem de vir antes de /:id
podcastRouter.get('/public', asyncHandler(podcastController.getPublic));
podcastRouter.get('/public/:id', asyncHandler(podcastController.getPublicOne));

// Listagem e detalhe — qualquer utilizador autenticado
podcastRouter.get('/', requireAuth, asyncHandler(podcastController.getAll));
podcastRouter.get('/:id/download', requireAuth, asyncHandler(podcastController.download));
podcastRouter.get(
  '/:id/compression-progress',
  requireAuth,
  asyncHandler(podcastController.getCompressionProgress),
);
podcastRouter.get('/:id', requireAuth, asyncHandler(podcastController.getOne));

// Publicar — apenas criador + upload de ficheiros
podcastRouter.post(
  '/',
  requireAuth,
  requireCreator,
  requireDeviceCertificate,
  uploadPodcast,
  asyncHandler(podcastController.create),
);

// Actualizar metadados — dono do podcast ou admin
podcastRouter.patch('/:id', requireAuth, asyncHandler(podcastController.update));

// Eliminar — dono do podcast ou admin
podcastRouter.delete('/:id', requireAuth, asyncHandler(podcastController.remove));
