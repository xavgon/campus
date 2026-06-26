import { Request, Response } from 'express';
import { config } from '../config';
import { testConnection } from '../database/pool';
import { sendSuccess } from '../utils/apiResponse';

export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  const database = await testConnection();

  sendSuccess(res, {
    service: 'CAMPUS API',
    status: 'ok',
    database: database ? 'connected' : 'disconnected',
    mtlsStrict: config.mtlsStrict,
    security: {
      ca: 'CA-CAMPUS/ISPTEC',
      minTlsVersion: 'TLSv1.2',
      hsts: true,
      mitmProtection: true,
    },
    timestamp: new Date().toISOString(),
  });
};
