import bcrypt from 'bcrypt';
import fs from 'fs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import path from 'path';
import { compressImage } from '../compression/compress';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { createUser, findUserByEmail, findUserById, mapToPublicUser, updateUserAvatar, updateUserPassword, updateUserProfile, type PublicUser } from '../models/user.model';
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

/** Gera token de reset e imprime o link no console (substitui SMTP). */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await findUserByEmail(email);
  if (!user) return; // resposta genérica — não revela se o email existe

  const payload: ResetTokenPayload = { userId: user.id, type: 'password-reset' };
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: RESET_TOKEN_EXPIRY });
  const resetLink = `${config.clientUrl}/reset-password?token=${token}`;

  // Em produção: enviar email com resetLink via SMTP/SendGrid
  console.info('[CAMPUS] ─── RESET DE PASSWORD ───────────────────────────');
  console.info(`[CAMPUS] Email : ${email}`);
  console.info(`[CAMPUS] Link  : ${resetLink}`);
  console.info(`[CAMPUS] Expira: 1 hora`);
  console.info('[CAMPUS] ─────────────────────────────────────────────────');
};

/** Valida token de reset e actualiza a password. */
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
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
};

export const updateAvatar = async (userId: string, newFilePath: string): Promise<PublicUser> => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('Utilizador não encontrado', 404);

  // apaga foto anterior se existir
  if (user.foto_perfil) {
    const oldPath = path.join(__dirname, '..', '..', user.foto_perfil);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  // comprimir a nova foto antes de guardar
  const physicalPath = path.join(process.cwd(), newFilePath);
  try {
    const result = await compressImage(physicalPath);
    console.log(
      `[CAMPUS] Avatar comprimido: ${result.originalSize} → ${result.compressedSize} bytes | ${result.compressionRatio}% redução`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[CAMPUS] Compressão de avatar falhou (guardado sem compressão): ${msg}`);
  }

  const updated = await updateUserAvatar(userId, newFilePath);
  if (!updated) throw new AppError('Erro ao actualizar foto', 500);
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
