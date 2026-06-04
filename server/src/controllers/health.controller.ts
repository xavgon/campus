import { Request, Response } from 'express';
import { testConnection } from '../database/pool';
import { sendSuccess } from '../utils/apiResponse';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const database = await testConnection();

  sendSuccess(res, {
    service: 'CAMPUS API',
    status: 'ok',
    database: database ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
};
