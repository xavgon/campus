import bcrypt from 'bcrypt';
import { getPool } from './pool';
import { createUser, findUserByEmail } from '../models/user.model';

export const DEFAULT_ADMIN_EMAIL = 'admin@campus.co.ao';
export const DEFAULT_ADMIN_PASSWORD = 'Campus123';
export const DEFAULT_ADMIN_NAME = 'Administrador CAMPUS';

const SALT_ROUNDS = 10;

/** Garante conta admin com credenciais padrão (idempotente). */
export const ensureDefaultAdmin = async (): Promise<void> => {
  const email = DEFAULT_ADMIN_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);
  const existing = await findUserByEmail(email);

  if (!existing) {
    await createUser(DEFAULT_ADMIN_NAME, email, passwordHash, 'admin');
    console.info(`[CAMPUS] Conta admin criada (${email}).`);
    return;
  }

  await getPool().query(
    'UPDATE users SET role = $1, nome = $2 WHERE email = $3',
    ['admin', DEFAULT_ADMIN_NAME, email],
  );

  const passwordMatches = await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, existing.password);
  if (!passwordMatches) {
    await getPool().query('UPDATE users SET password = $1, nome = $2 WHERE email = $3', [
      passwordHash,
      DEFAULT_ADMIN_NAME,
      email,
    ]);
    console.info(`[CAMPUS] Password do admin reposta para o valor padrão (${email}).`);
  }
};
