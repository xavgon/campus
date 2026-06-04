import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { createUser, findUserByEmail, findUserById, mapToPublicUser, type PublicUser } from '../models/user.model';
import type { UserRole } from '../types/roles';

const SALT_ROUNDS = 10;

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

const signToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const verifyToken = (token: string): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    return decoded;
  } catch {
    throw new AppError('Token inválido ou expirado', 401);
  }
};

export const register = async (
  nome: string,
  email: string,
  password: string,
): Promise<AuthResult> => {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError('Email já registado', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await createUser(nome, email, passwordHash);
  const token = signToken({ userId: user.id, email: user.email, role: user.role });

  return { token, user };
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError('Email ou password incorretos', 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('Email ou password incorretos', 401);
  }

  const publicUser = mapToPublicUser(user);
  const token = signToken({
    userId: publicUser.id,
    email: publicUser.email,
    role: publicUser.role,
  });
  return { token, user: publicUser };
};

/** Resposta genérica — não revela se o email existe (segurança). */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await findUserByEmail(email);
  if (user) {
    // TODO: enviar email com token de reset (SMTP / serviço de email)
    console.info(`[CAMPUS] Pedido de reset de password para: ${email}`);
  }
};

export const getProfile = async (userId: string): Promise<PublicUser> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError('Utilizador não encontrado', 404);
  }
  return mapToPublicUser(user);
};
