/**
 * Matriz de capacidades por papel (RF12) — espelha server/src/types/roles.ts
 */
import type { UserRole } from '@/features/auth/types/auth.types';

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Utilizador',
  creator: 'Criador',
  admin: 'Administrador',
};

export interface RoleCapabilities {
  role: UserRole;
  label: string;
  canPublish: boolean;
  canBroadcast: boolean;
  canAccessAdmin: boolean;
  canBrowseLibrary: boolean;
  canDownload: boolean;
}

export const getRoleCapabilities = (role: UserRole): RoleCapabilities => ({
  role,
  label: ROLE_LABELS[role],
  canPublish: role === 'creator',
  canBroadcast: role === 'creator',
  canAccessAdmin: role === 'admin',
  canBrowseLibrary: true,
  canDownload: true,
});
