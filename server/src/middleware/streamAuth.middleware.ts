import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service';
import { AppError } from './errorHandler';

/**
 * Middleware de autenticação exclusivo para o endpoint de streaming.
 *
 * O elemento <audio src="..."> do browser não envia o header Authorization,
 * por isso este middleware aceita o token JWT de duas formas:
 *
 *   1. Header (chamadas normais da API):
 *        Authorization: Bearer <token>
 *
 *   2. Query parameter (player de áudio no browser/Electron):
 *        GET /api/stream/:id?token=<token>
 *
 * Todos os outros endpoints continuam a usar requireAuth (header only).
 */
export const requireStreamAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    let token: string | undefined;

    // 1. Tentar extrair do header Authorization
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      token = header.slice(7);
    }

    // 2. Fallback: query param ?token=
    if (!token && typeof req.query.token === 'string' && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new AppError('Autenticação necessária', 401);
    }

    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
