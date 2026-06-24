import { Router } from 'express';
import * as categoriesController from '../controllers/categories.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';

export const categoriesRouter = Router();

categoriesRouter.get('/', requireAuth, asyncHandler(categoriesController.getCategories));
