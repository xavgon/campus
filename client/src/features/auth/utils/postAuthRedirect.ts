import type { UserRole } from '@/features/auth/types/auth.types';

/** RF01 — Destino após login/registo conforme o papel do utilizador. */
export const getPostAuthPath = (role: UserRole): string =>
  role === 'admin' ? '/admin' : '/dashboard';
