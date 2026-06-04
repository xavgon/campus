import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as presenceService from '../services/presence.service';
import { sendSuccess } from '../utils/apiResponse';

export const heartbeat = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  const user = await authService.getProfile(userId);
  presenceService.touchPresence(userId, user.nome);
  sendSuccess(res, { ok: true }, 'Presença actualizada');
};

export const leave = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  presenceService.removePresence(userId);
  sendSuccess(res, { ok: true }, 'Sessão terminada');
};

export const getOnline = async (_req: Request, res: Response): Promise<void> => {
  const snapshot = presenceService.getOnlineSnapshot();
  sendSuccess(res, snapshot, 'Utilizadores ligados');
};
