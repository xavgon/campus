import { Request, Response } from 'express';
import { sendError } from '../utils/apiResponse';

export const notFoundHandler = (_req: Request, res: Response): void => {
  sendError(res, 'Rota não encontrada', 404);
};
