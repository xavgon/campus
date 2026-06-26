import type { User } from '@/features/auth/types/auth.types';
import type { Podcast } from '@/features/podcasts/types/podcast';

export const canManagePodcast = (user: User | null | undefined, podcast: Podcast): boolean => {
  if (!user) return false;
  return user.role === 'creator' && user.id === podcast.authorId;
};
