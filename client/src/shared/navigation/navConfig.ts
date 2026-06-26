import type { User } from '@/features/auth/types/auth.types';
import { canPublishPodcasts } from '@/features/auth/utils/canPublish';
import { isAdminUser } from '@/features/auth/utils/isAdmin';

export type NavIconKey = 'book';

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  className?: string;
  icon?: NavIconKey;
  /** Substitui a lógica por defeito do NavLink (ex.: /podcasts sem apanhar /podcasts/new) */
  isActive?: (pathname: string) => boolean;
}

export const USER_MANUAL_TO = '/ajuda';

const HELP_NAV_ITEM: NavItem = { to: USER_MANUAL_TO, label: 'Ajuda', icon: 'book' };

/** Visitante — páginas públicas */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', end: true },
  { to: '/explorar', label: 'Explorar' },
  HELP_NAV_ITEM,
  { to: '/login', label: 'Entrar' },
  { to: '/register', label: 'Criar conta', className: 'hidden sm:inline-flex' },
];

const LIVE_NAV_ITEM: NavItem = {
  to: '/live',
  label: 'Ao vivo',
  isActive: (pathname) =>
    pathname === '/live' ||
    (pathname.startsWith('/live/') && pathname !== '/live/broadcast'),
};

/** Sessão iniciada — área da aplicação (Perfil e manual via NavUserMenu / rodapé da sidebar). */
const APP_NAV_BASE: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  {
    to: '/podcasts',
    label: 'Podcasts',
    isActive: (pathname) =>
      pathname === '/podcasts' ||
      (pathname.startsWith('/podcasts/') && pathname !== '/podcasts/new'),
  },
  LIVE_NAV_ITEM,
];

const PUBLISH_NAV_ITEM: NavItem = { to: '/podcasts/new', label: 'Publicar', end: true };

/** @deprecated Prefer getAppNavItems(user) — inclui «Publicar» só para criadores. */
export const APP_NAV_ITEMS: NavItem[] = [...APP_NAV_BASE, PUBLISH_NAV_ITEM];

const ADMIN_NAV_ITEM: NavItem = {
  to: '/admin',
  label: 'Admin',
  isActive: (pathname) => pathname === '/admin' || pathname.startsWith('/admin/'),
};

export const getAppNavItems = (user: User | null): NavItem[] => {
  const items = canPublishPodcasts(user)
    ? [...APP_NAV_BASE.slice(0, 2), PUBLISH_NAV_ITEM, ...APP_NAV_BASE.slice(2)]
    : APP_NAV_BASE;

  return isAdminUser(user) ? [...items, ADMIN_NAV_ITEM] : items;
};

const APP_ROUTE_PREFIXES = ['/dashboard', '/podcasts', '/live', '/profile', '/admin', '/ajuda'] as const;

export const isAppAreaRoute = (pathname: string): boolean =>
  APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
