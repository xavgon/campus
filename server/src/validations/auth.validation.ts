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
