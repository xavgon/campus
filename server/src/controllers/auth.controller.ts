import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { insertLog, listLogsForUser } from '../models/log.model';
import { deviceAccessFromRequest } from '../security/deviceAccess';
import { sendSuccess } from '../utils/apiResponse';
import { validateForgotPassword, validateLogin, validateRegister, validateResetPassword, validateUpdatePassword, validateUpdateProfile } from '../validations/auth.validation';

const withDeviceAccess = <T extends object>(req: Request, payload: T) => ({
  ...payload,
  deviceAccess: deviceAccessFromRequest(req),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const input = validateRegister(req.body);
  const result = await authService.register(input.nome, input.email, input.password);
  await insertLog(result.user.id, `Registo: ${input.email}`, req.clientCert ?? null);
  sendSuccess(res, withDeviceAccess(req, result), 'Conta criada com sucesso', 201);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const input = validateLogin(req.body);
  const result = await authService.login(input.email, input.password);
  await insertLog(result.user.id, `Login: ${input.email}`, req.clientCert ?? null);
  sendSuccess(res, withDeviceAccess(req, result), 'Login realizado com sucesso');
};

export const getAccessInfo = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  const user = await authService.getProfile(userId);
  sendSuccess(res, {
    user,
    deviceAccess: deviceAccessFromRequest(req),
    layers: {
      device: deviceAccessFromRequest(req).mode === 'certificate' ? 'certificate' : 'allowlist',
      user: 'jwt',
    },
  });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const input = validateForgotPassword(req.body);
  await authService.requestPasswordReset(input.email);
  sendSuccess(res, null, 'Se o email existir, receberás instruções para redefinir a password.');
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = validateResetPassword(req.body);
  const userId = await authService.resetPassword(token, newPassword);
  await insertLog(userId, 'Password redefinida (recuperação)', req.clientCert ?? null);
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
  await insertLog(userId, 'Foto de perfil actualizada', req.clientCert ?? null);
  sendSuccess(res, { user }, 'Foto de perfil actualizada com sucesso');
};

export const deleteAvatar = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const user = await authService.removeAvatar(userId);
  await insertLog(userId, 'Foto de perfil removida', req.clientCert ?? null);
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
  await insertLog(userId, `Perfil actualizado: ${nome}`, req.clientCert ?? null);
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
  await insertLog(userId, 'Password alterada (perfil)', req.clientCert ?? null);
  sendSuccess(res, null, 'Password alterada com sucesso');
};

export const getActivity = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const logs = await listLogsForUser(userId);
  sendSuccess(res, { logs }, 'Actividade recente');
};

export const becomeCreator = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const result = await authService.becomeCreator(userId);
  await insertLog(userId, 'Conta de criador activada', req.clientCert ?? null);
  sendSuccess(res, result, 'Conta de criador activada com sucesso');
};

export const leaveCreator = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }
  const result = await authService.leaveCreator(userId);
  await insertLog(userId, 'Conta de criador encerrada', req.clientCert ?? null);
  const { deleted } = result;
  const summary =
    deleted.podcasts + deleted.streams > 0
      ? `Conta de criador encerrada. Foram eliminados ${deleted.podcasts} episódio(s) e ${deleted.streams} transmissão(ões).`
      : 'Conta de criador encerrada com sucesso.';
  sendSuccess(res, result, summary);
};
