import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadAvatar } from '../middleware/upload.middleware';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
authRouter.post('/forgot-password', asyncHandler(authController.forgotPassword));
authRouter.post('/reset-password', asyncHandler(authController.resetPassword));
authRouter.get('/profile', requireAuth, asyncHandler(authController.getProfile));
authRouter.put('/profile', requireAuth, asyncHandler(authController.updateProfile));
authRouter.put('/profile/photo', requireAuth, uploadAvatar, asyncHandler(authController.updateAvatar));
authRouter.delete('/profile/photo', requireAuth, asyncHandler(authController.deleteAvatar));
authRouter.post('/profile/become-creator', requireAuth, asyncHandler(authController.becomeCreator));
authRouter.post('/profile/leave-creator', requireAuth, asyncHandler(authController.leaveCreator));
authRouter.put('/password', requireAuth, asyncHandler(authController.updatePassword));
