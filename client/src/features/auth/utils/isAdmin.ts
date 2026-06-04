import type { User } from '@/features/auth/types/auth.types';

export const isAdminUser = (user: User | null | undefined): boolean =>
  (user?.role ?? 'user') === 'admin';
