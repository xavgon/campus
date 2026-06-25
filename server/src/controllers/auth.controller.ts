import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { validateForgotPassword, validateLogin, validateRegister, validateResetPassword, validateUpdatePassword, validateUpdateProfile } from '../validations/auth.validation';

export const register = async (req: Request, res: Response): Promise<void> => {
  const input = validateRegister(req.body);
  const result = await authService.register(input.nome, input.email, input.password);
  sendSuccess(res, result, 'Conta criada com sucesso', 201);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const input = validateLogin(req.body);
  const result = await authService.login(input.email, input.password);
  sendSuccess(res, result, 'Login realizado com sucesso');
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const input = validateForgotPassword(req.body);
  await authService.requestPasswordReset(input.email);
  sendSuccess(res, null, 'Se o email existir, receberás instruções para redefinir a password.');
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = validateResetPassword(req.body);
  await authService.resetPassword(token, newPassword);
  sendSuccess(res, null, 'Password redefinida com sucesso. Podes fazer login.');
};

export const updateAvatar = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Nenhuma imagem enviada', data: null });
    return;
  }
  const filePath = `/uploads/avatars/${req.file.filename}`;
  const user = await authService.updateAvatar(userId, filePath);
  sendSuccess(res, { user }, 'Foto de perfil actualizada com sucesso');
};

export const deleteAvatar = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const user = await authService.removeAvatar(userId);
  sendSuccess(res, { user }, 'Foto de perfil removida com sucesso');
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const user = await authService.getProfile(userId);
  sendSuccess(res, { user });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const { nome } = validateUpdateProfile(req.body);
  const user = await authService.updateProfile(userId, nome);
  sendSuccess(res, { user }, 'Perfil actualizado com sucesso');
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const { currentPassword, newPassword } = validateUpdatePassword(req.body);
  await authService.updatePassword(userId, currentPassword, newPassword);
  sendSuccess(res, null, 'Password alterada com sucesso');
};

export const becomeCreator = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const result = await authService.becomeCreator(userId);
  sendSuccess(res, result, 'Conta de criador activada com sucesso');
};

export const leaveCreator = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const result = await authService.leaveCreator(userId);
  const { deleted } = result;
  const summary =
    deleted.podcasts + deleted.streams > 0
      ? `Conta de criador encerrada. Foram eliminados ${deleted.podcasts} episódio(s) e ${deleted.streams} transmissão(ões).`
      : 'Conta de criador encerrada com sucesso.';
  sendSuccess(res, result, summary);
};
