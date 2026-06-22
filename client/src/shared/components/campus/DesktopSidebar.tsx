import { NavLink, useLocation } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '@/features/admin/constants';
import type { User } from '@/features/auth/types/auth.types';
import { isAdminUser } from '@/features/auth/utils/isAdmin';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { NavUserName } from '@/shared/components/campus/NavUserName';
import { getAppNavItems, type NavItem } from '@/shared/navigation/navConfig';
import { BRAND } from '@/shared/styles/brand';

interface DesktopSidebarProps {
  user: User;
  onLogout: () => void;
}

const isNavItemActive = (pathname: string, item: NavItem): boolean => {
  if (item.isActive) return item.isActive(pathname);
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

const SidebarLink = ({ item }: { item: NavItem }) => {
  const { pathname } = useLocation();

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={() => {
        const active = isNavItemActive(pathname, item);
        return [
          'campus-desktop-sidebar__link',
          active && 'campus-desktop-sidebar__link--active',
        ]
          .filter(Boolean)
          .join(' ');
      }}
    >
      {item.label}
    </NavLink>
  );
};

export const DesktopSidebar = ({ user, onLogout }: DesktopSidebarProps) => {
  const { pathname } = useLocation();
  const isAdmin = isAdminUser(user);
  const onProfile = pathname === '/profile';

  return (
    <aside className="campus-desktop-sidebar" aria-label="Navegação da aplicação">
      <NavLink
        to="/dashboard"
        className="campus-desktop-sidebar__brand"
        aria-label={`${BRAND.name} — Dashboard`}
      >
        <img
          src={BRAND.logoIcon}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 object-contain"
          decoding="async"
        />
        <span className="font-bold tracking-wide">
          <span className="text-campus-primary">CA</span>
          <span className="text-campus-accent">MPUS</span>
        </span>
      </NavLink>

      <nav className="campus-desktop-sidebar__nav" aria-label="Área principal">
        {getAppNavItems(user).map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>

      {isAdmin && (
        <>
          <p className="campus-desktop-sidebar__section">Administração</p>
          <nav className="campus-desktop-sidebar__nav campus-desktop-sidebar__nav--compact" aria-label="Administração">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = item.end
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(`${item.to}/`);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={() =>
                    [
                      'campus-desktop-sidebar__link campus-desktop-sidebar__link--sub',
                      active && 'campus-desktop-sidebar__link--active',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  }
                >
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] font-normal leading-snug text-campus-muted">
                    {item.description}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </>
      )}

      <div className="campus-desktop-sidebar__footer">
        <NavLink
          to="/profile"
          className={`campus-desktop-sidebar__profile ${onProfile ? 'campus-desktop-sidebar__profile--active' : ''}`}
          aria-current={onProfile ? 'page' : undefined}
        >
          <ProfileAvatar nome={user.nome} fotoUrl={user.foto_perfil} size="sm" />
          <span className="min-w-0 flex-1">
            <NavUserName nome={user.nome} className="block truncate text-sm" />
            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-campus-muted">
              Perfil
            </span>
          </span>
        </NavLink>

        <button type="button" onClick={onLogout} className="campus-desktop-sidebar__logout">
          Sair
        </button>
      </div>
    </aside>
  );
};
