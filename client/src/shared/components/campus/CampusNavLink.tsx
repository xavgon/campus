import type { ReactNode } from 'react';
import { NavLink, useLocation, type NavLinkProps } from 'react-router-dom';
import { NavIcon } from '@/shared/components/campus/NavIcon';
import type { NavIconKey } from '@/shared/navigation/navConfig';

type CampusNavLinkProps = Omit<NavLinkProps, 'children'> & {
  children: ReactNode;
  icon?: NavIconKey;
  matchPath?: (pathname: string) => boolean;
};

export const CampusNavLink = ({
  className = '',
  children,
  end,
  icon,
  matchPath,
  ...props
}: CampusNavLinkProps) => {
  const { pathname } = useLocation();

  return (
    <NavLink
      end={end}
      className={({ isActive }) => {
        const active = matchPath ? matchPath(pathname) : isActive;
        return ['campus-nav-link', active && 'campus-nav-link--active', className]
          .filter(Boolean)
          .join(' ');
      }}
      {...props}
    >
      {icon ? (
        <span className="campus-nav-link__icon" aria-hidden>
          <NavIcon name={icon} />
        </span>
      ) : null}
      <span className="campus-nav-link__label">{children}</span>
    </NavLink>
  );
};
