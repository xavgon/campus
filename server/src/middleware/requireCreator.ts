import { NextFunction, Request, Response } from 'express';
import { canPublishPodcasts } from '../types/roles';
import { AppError } from './errorHandler';

export const requireCreator = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user?.userId) {
    next(new AppError('Autenticação necessária', 401));
    return;
  }

  if (!canPublishPodcasts(req.user.role)) {
    next(new AppError('Apenas criadores podem publicar podcasts', 403));
    return;
  }

  next();
};
