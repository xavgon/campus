import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service';
import { AppError } from './errorHandler';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Autenticação necessária', 401);
    }

    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
