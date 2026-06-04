import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';
import { validateForgotPassword, validateLogin, validateRegister } from '../validations/auth.validation';

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
  sendSuccess(
    res,
    null,
    'Se o email existir, receberás instruções para redefinir a password.',
  );
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
