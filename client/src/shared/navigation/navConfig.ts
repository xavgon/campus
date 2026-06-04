import type { User } from '@/features/auth/types/auth.types';
import { isAdminUser } from '@/features/auth/utils/isAdmin';

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  className?: string;
  /** Substitui a lógica por defeito do NavLink (ex.: /podcasts sem apanhar /podcasts/new) */
  isActive?: (pathname: string) => boolean;
}

/** Visitante — páginas públicas */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', end: true },
  { to: '/explorar', label: 'Explorar' },
  { to: '/login', label: 'Entrar' },
  { to: '/register', label: 'Criar conta', className: 'hidden sm:inline-flex' },
];

/** Sessão iniciada — área da aplicação */
export const APP_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  {
    to: '/podcasts',
    label: 'Podcasts',
    isActive: (pathname) =>
      pathname === '/podcasts' ||
      (pathname.startsWith('/podcasts/') && pathname !== '/podcasts/new'),
  },
  { to: '/podcasts/new', label: 'Publicar', end: true },
  { to: '/profile', label: 'Perfil', end: true },
];

const ADMIN_NAV_ITEM: NavItem = {
  to: '/admin',
  label: 'Admin',
  isActive: (pathname) => pathname === '/admin' || pathname.startsWith('/admin/'),
};

export const getAppNavItems = (user: User | null): NavItem[] =>
  isAdminUser(user) ? [...APP_NAV_ITEMS, ADMIN_NAV_ITEM] : APP_NAV_ITEMS;

const APP_ROUTE_PREFIXES = ['/dashboard', '/podcasts', '/profile', '/admin'] as const;

export const isAppAreaRoute = (pathname: string): boolean =>
  APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
