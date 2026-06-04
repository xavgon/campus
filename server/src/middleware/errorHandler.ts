import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/apiResponse';

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  console.error('[CAMPUS] Erro interno:', err.message);
  sendError(res, 'Ocorreu um erro interno. Tente novamente mais tarde.', 500);
};
