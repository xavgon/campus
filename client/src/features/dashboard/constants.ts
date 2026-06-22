import type { User } from '@/features/auth/types/auth.types';
import { canPublishPodcasts } from '@/features/auth/utils/canPublish';

export type DashboardShortcutIcon = 'podcasts' | 'publish' | 'live' | 'explore' | 'profile';

export interface DashboardShortcut {
  to: string;
  title: string;
  description: string;
  icon: DashboardShortcutIcon;
  accent?: boolean;
  requiresPublish?: boolean;
}

export const DASHBOARD_SHORTCUTS: DashboardShortcut[] = [
  {
    to: '/podcasts',
    title: 'Os meus podcasts',
    description: 'Biblioteca completa, filtros e estados.',
    icon: 'podcasts',
  },
  {
    to: '/podcasts/new',
    title: 'Publicar episódio',
    description: 'Áudio, capa e metadados num só fluxo.',
    icon: 'publish',
    accent: true,
    requiresPublish: true,
  },
  {
    to: '/live',
    title: 'Ao vivo',
    description: 'Ver emissões em curso ou transmitir.',
    icon: 'live',
  },
  {
    to: '/explorar',
    title: 'Explorar',
    description: 'Descobrir conteúdos na plataforma.',
    icon: 'explore',
  },
  {
    to: '/profile',
    title: 'Perfil',
    description: 'Nome, avatar e segurança da conta.',
    icon: 'profile',
  },
];

export const getDashboardShortcuts = (user: User | null): DashboardShortcut[] =>
  DASHBOARD_SHORTCUTS.filter(
    (shortcut) => !shortcut.requiresPublish || canPublishPodcasts(user),
  );
