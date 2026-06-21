import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CampusNavLink } from '@/shared/components/campus/CampusNavLink';
import { NavBrand } from '@/shared/components/campus/NavBrand';
import { NavUserMenu } from '@/shared/components/campus/NavUserMenu';
import { useNavIndicator } from '@/shared/hooks/useNavIndicator';
import {
  getAppNavItems,
  isAppAreaRoute,
  PUBLIC_NAV_ITEMS,
} from '@/shared/navigation/navConfig';

export const CampusNav = () => {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const isAppArea = isAppAreaRoute(pathname);
  const navItems = !isLoading && isAuthenticated ? getAppNavItems(user) : PUBLIC_NAV_ITEMS;

  const { navRef, indicator } = useNavIndicator(pathname, isLoading, isAuthenticated);

  return (
    <header
      className={`campus-nav-header z-30 backdrop-blur-xl ${
        isAppArea ? 'bg-campus-surface-dark/95' : 'bg-black/30'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-visible px-5 py-4 sm:gap-4 sm:px-8">
        <NavBrand size="sm" />

        <nav
          ref={navRef}
          className="campus-nav-track campus-nav-track--scroll min-w-0 flex-1 justify-center sm:flex-none sm:justify-start"
          aria-label="Navegação principal"
        >
          <span
            className={`campus-nav-indicator ${indicator.ready ? 'campus-nav-indicator--visible' : ''}`}
            style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
            aria-hidden
          />
          {navItems.map((item) => (
            <CampusNavLink
              key={item.to}
              to={item.to}
              end={item.end}
              matchPath={item.isActive}
              className={item.className}
            >
              {item.label}
            </CampusNavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center">
          {!isLoading && isAuthenticated && user ? (
            <NavUserMenu user={user} onLogout={logout} />
          ) : (
            !isLoading &&
            !isAuthenticated && (
              <Link
                to="/register"
                className="rounded-none bg-campus-primary px-4 py-2 text-sm font-bold text-campus-on-primary shadow-md shadow-black/40 transition hover:bg-campus-primary-dark sm:hidden"
              >
                Registar
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};
