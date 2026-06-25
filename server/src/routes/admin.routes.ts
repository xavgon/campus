import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/requireAdmin';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/overview', asyncHandler(adminController.overview));
adminRouter.get('/categories', asyncHandler(adminController.getCategories));
adminRouter.get('/logs', asyncHandler(adminController.getLogs));

adminRouter.get('/notifications', asyncHandler(adminController.getNotifications));
adminRouter.get('/notifications/unread-count', asyncHandler(adminController.getNotificationUnreadCount));
adminRouter.post('/notifications/read-all', asyncHandler(adminController.postNotificationsReadAll));
adminRouter.patch('/notifications/:id/read', asyncHandler(adminController.patchNotificationRead));

adminRouter.get('/users', asyncHandler(adminController.getUsers));
adminRouter.patch('/users/:id', asyncHandler(adminController.patchUser));
adminRouter.delete('/users/:id', asyncHandler(adminController.deleteUser));

adminRouter.get('/podcasts', asyncHandler(adminController.getPodcasts));
adminRouter.post('/podcasts', asyncHandler(adminController.postPodcast));
adminRouter.patch('/podcasts/:id', asyncHandler(adminController.patchPodcast));
adminRouter.delete('/podcasts/:id', asyncHandler(adminController.deletePodcast));

adminRouter.get('/streams', asyncHandler(adminController.getStreams));
adminRouter.post('/streams', asyncHandler(adminController.postStream));
adminRouter.patch('/streams/:id', asyncHandler(adminController.patchStream));
adminRouter.delete('/streams/:id', asyncHandler(adminController.deleteStream));
