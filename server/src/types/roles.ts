export type UserRole = 'user' | 'admin';

export const USER_ROLES: UserRole[] = ['user', 'admin'];

export const isUserRole = (value: string): value is UserRole =>
  USER_ROLES.includes(value as UserRole);
