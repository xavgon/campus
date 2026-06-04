import { NextFunction, Request, Response } from 'express';
import { findUserById } from '../models/user.model';
import { AppError } from './errorHandler';

export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Autenticação necessária', 401);
    }

    const user = await findUserById(userId);
    if (!user || user.role !== 'admin') {
      throw new AppError('Acesso reservado a administradores', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
