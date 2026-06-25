import type { User } from '@/features/auth/types/auth.types';

export const canPublishPodcasts = (user: User | null | undefined): boolean => {
  const role = user?.role ?? 'user';
  return role === 'creator';
};
