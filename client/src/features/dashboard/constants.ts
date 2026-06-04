export type DashboardShortcutIcon = 'podcasts' | 'publish' | 'explore' | 'profile';

export interface DashboardShortcut {
  to: string;
  title: string;
  description: string;
  icon: DashboardShortcutIcon;
  accent?: boolean;
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
