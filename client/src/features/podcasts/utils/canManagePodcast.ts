import type { User } from '@/features/auth/types/auth.types';
import { isAdminUser } from '@/features/auth/utils/isAdmin';
import type { Podcast } from '@/features/podcasts/types/podcast';

export const canManagePodcast = (user: User | null | undefined, podcast: Podcast): boolean => {
  if (!user) return false;
  return user.id === podcast.authorId || isAdminUser(user);
};
