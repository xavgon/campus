import { AppError } from '../middleware/errorHandler';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegisterInput {
  nome: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(`${field} é obrigatório`);
  }
  return value.trim();
};

export const validateRegister = (body: unknown): RegisterInput => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Dados inválidos');
  }

  const data = body as Record<string, unknown>;
  const nome = requireString(data.nome, 'Nome');
  const email = requireString(data.email, 'Email').toLowerCase();
  const password = requireString(data.password, 'Password');

  if (nome.length < 2) {
    throw new AppError('Nome deve ter pelo menos 2 caracteres');
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('Email inválido');
  }
  if (password.length < 6) {
    throw new AppError('Password deve ter pelo menos 6 caracteres');
  }

  return { nome, email, password };
};

export const validateLogin = (body: unknown): LoginInput => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Dados inválidos');
  }

  const data = body as Record<string, unknown>;
  const email = requireString(data.email, 'Email').toLowerCase();
  const password = requireString(data.password, 'Password');

  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('Email inválido');
  }

  return { email, password };
};

export interface UpdateProfileInput {
  nome: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const validateUpdateProfile = (body: unknown): UpdateProfileInput => {
  if (!body || typeof body !== 'object') throw new AppError('Dados inválidos');
  const data = body as Record<string, unknown>;
  const nome = requireString(data.nome, 'Nome');
  if (nome.length < 2) throw new AppError('Nome deve ter pelo menos 2 caracteres');
  return { nome };
};

export const validateUpdatePassword = (body: unknown): UpdatePasswordInput => {
  if (!body || typeof body !== 'object') throw new AppError('Dados inválidos');
  const data = body as Record<string, unknown>;
  const currentPassword = requireString(data.currentPassword, 'Password actual');
  const newPassword = requireString(data.newPassword, 'Nova password');
  if (newPassword.length < 6) throw new AppError('Nova password deve ter pelo menos 6 caracteres');
  if (currentPassword === newPassword) throw new AppError('A nova password deve ser diferente da actual');
  return { currentPassword, newPassword };
};

export const validateForgotPassword = (body: unknown): ForgotPasswordInput => {
  if (!body || typeof body !== 'object') {
    throw new AppError('Dados inválidos');
  }

  const data = body as Record<string, unknown>;
  const email = requireString(data.email, 'Email').toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('Email inválido');
  }

  return { email };
};
