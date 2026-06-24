import type { Request, Response } from 'express';
import { listCategories } from '../models/category.model';
import { sendSuccess } from '../utils/apiResponse';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await listCategories();
  sendSuccess(res, { categories });
};
