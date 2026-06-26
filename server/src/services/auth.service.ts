import bcrypt from 'bcrypt';
import fs from 'fs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import path from 'path';
import { compressImage } from '../compression/compress';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { deliverPasswordResetEmail } from '../mail/passwordResetDelivery';
import { createUser, findUserByEmail, findUserById, mapToPublicUser, updateUserAvatar, updateUserPassword, updateUserProfile, upgradeUserToCreator, downgradeCreatorToUser, type PublicUser } from '../models/user.model';
import { purgeCreatorContent } from './creatorContent.service';
import {
  notifyPasswordResetRequested,
  notifyUserBecameCreator,
  notifyUserLeftCreator,
  notifyUserRegistered,
} from './adminNotification.service';
import type { UserRole } from '../types/roles';

const SALT_ROUNDS = 10;

const toPhysicalPath = (relativePath: string): string =>
  path.join(process.cwd(), relativePath.replace(/^\//, ''));

const toPublicUploadPath = (absolutePath: string): string => {
  const relative = path.relative(process.cwd(), absolutePath).replace(/\\/g, '/');
  return relative.startsWith('/') ? relative : `/${relative}`;
};

const unlinkUpload = (relativePath: string | null | undefined): void => {
  if (!relativePath) return;
  const physical = toPhysicalPath(relativePath);
  if (fs.existsSync(physical)) fs.unlinkSync(physical);
};

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
}

export interface LeaveCreatorResult extends AuthResult {
  deleted: { podcasts: number; streams: number };
}

const signToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  });

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
  void notifyUserRegistered(user);
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

// ─── Reset de password ────────────────────────────────────────────────────────

interface ResetTokenPayload {
  userId: string;
  type: 'password-reset';
}

const RESET_TOKEN_EXPIRY = '1h';
const RESET_TOKEN_EXPIRY_LABEL = '1 hora';

/** Gera token de reset e envia email SMTP (ou regista link no console em dev). */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await findUserByEmail(email);
  if (!user) return; // resposta genérica — não revela se o email existe

  void notifyPasswordResetRequested(user.email);

  const payload: ResetTokenPayload = { userId: user.id, type: 'password-reset' };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: RESET_TOKEN_EXPIRY });
  const resetLink = `${config.clientUrl}/reset-password?token=${token}`;

  await deliverPasswordResetEmail({
    email: user.email,
    recipientName: user.nome,
    resetLink,
    expiresInLabel: RESET_TOKEN_EXPIRY_LABEL,
  });
};

/** Valida token de reset e actualiza a password. Devolve o id do utilizador. */
export const resetPassword = async (token: string, newPassword: string): Promise<string> => {
  let payload: ResetTokenPayload;

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as ResetTokenPayload;
    if (decoded.type !== 'password-reset') {
      throw new AppError('Token inválido', 400);
    }
    payload = decoded;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Token inválido ou expirado', 400);
  }

  const user = await findUserById(payload.userId);
  if (!user) throw new AppError('Utilizador não encontrado', 404);

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await updateUserPassword(payload.userId, hash);
  return payload.userId;
};

export const updateAvatar = async (userId: string, newFilePath: string): Promise<PublicUser> => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('Utilizador não encontrado', 404);

  unlinkUpload(user.foto_perfil);

  const physicalPath = toPhysicalPath(newFilePath);
  let storedPath = newFilePath.startsWith('/') ? newFilePath : `/${newFilePath}`;

  try {
    const result = await compressImage(physicalPath);
    storedPath = toPublicUploadPath(result.outputPath);
    console.log(
      `[CAMPUS] Avatar comprimido: ${result.originalSize} → ${result.compressedSize} bytes | ${result.compressionRatio}% redução`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[CAMPUS] Compressão de avatar falhou (guardado sem compressão): ${msg}`);
  }

  const updated = await updateUserAvatar(userId, storedPath);
  if (!updated) throw new AppError('Erro ao actualizar foto', 500);
  return updated;
};

export const removeAvatar = async (userId: string): Promise<PublicUser> => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('Utilizador não encontrado', 404);

  unlinkUpload(user.foto_perfil);

  const updated = await updateUserAvatar(userId, null);
  if (!updated) throw new AppError('Erro ao remover foto', 500);
  return updated;
};

export const getProfile = async (userId: string): Promise<PublicUser> => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('Utilizador não encontrado', 404);
  return mapToPublicUser(user);
};

export const updateProfile = async (userId: string, nome: string): Promise<PublicUser> => {
  const updated = await updateUserProfile(userId, nome);
  if (!updated) throw new AppError('Utilizador não encontrado', 404);
  return updated;
};

export const updatePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('Utilizador não encontrado', 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Password actual incorrecta', 401);

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await updateUserPassword(userId, hash);
};

/** Auto-promoção a criador — apenas contas com papel `user`. Emite novo JWT. */
export const becomeCreator = async (userId: string): Promise<AuthResult> => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('Utilizador não encontrado', 404);

  if (user.role === 'admin') {
    throw new AppError('Contas de administrador não podem activar o modo criador', 400);
  }

  const publicUser =
    user.role === 'creator' ? mapToPublicUser(user) : await upgradeUserToCreator(userId);

  if (!publicUser) {
    throw new AppError('Não foi possível activar a conta de criador', 400);
  }

  const token = signToken({
    userId: publicUser.id,
    email: publicUser.email,
    role: publicUser.role,
  });

  if (user.role === 'user') {
    void notifyUserBecameCreator(publicUser);
  }

  return { token, user: publicUser };
};
export const leaveCreator = async (userId: string): Promise<LeaveCreatorResult> => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('Utilizador não encontrado', 404);

  if (user.role === 'admin') {
    throw new AppError('Contas de administrador não usam o modo criador', 400);
  }

  if (user.role === 'user') {
    const publicUser = mapToPublicUser(user);
    const token = signToken({
      userId: publicUser.id,
      email: publicUser.email,
      role: publicUser.role,
    });
    return { token, user: publicUser, deleted: { podcasts: 0, streams: 0 } };
  }

  const deleted = await purgeCreatorContent(userId);
  const publicUser = await downgradeCreatorToUser(userId);

  if (!publicUser) {
    throw new AppError('Não foi possível actualizar o papel', 400);
  }

  const token = signToken({
    userId: publicUser.id,
    email: publicUser.email,
    role: publicUser.role,
  });

  void notifyUserLeftCreator(publicUser, deleted);

  return { token, user: publicUser, deleted };
};
