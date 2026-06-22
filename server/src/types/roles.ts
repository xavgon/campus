export type UserRole = 'user' | 'creator' | 'admin';

export const USER_ROLES: UserRole[] = ['user', 'creator', 'admin'];

export const PUBLISHER_ROLES: UserRole[] = ['creator', 'admin'];

export const isUserRole = (value: string): value is UserRole =>
  USER_ROLES.includes(value as UserRole);

export const canPublishPodcasts = (role: UserRole | string | undefined): boolean =>
  role === 'creator' || role === 'admin';
