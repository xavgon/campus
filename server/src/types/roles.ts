export type UserRole = 'user' | 'creator' | 'admin';

export const USER_ROLES: UserRole[] = ['user', 'creator', 'admin'];

// Task 9 — Separação de papéis: apenas 'creator' pode publicar podcasts.
// 'admin' gere a plataforma (utilizadores, logs, certs) mas NÃO é criador de conteúdo.
export const PUBLISHER_ROLES: UserRole[] = ['creator'];

export const isUserRole = (value: string): value is UserRole =>
  USER_ROLES.includes(value as UserRole);

export const canPublishPodcasts = (role: UserRole | string | undefined): boolean =>
  role === 'creator';
