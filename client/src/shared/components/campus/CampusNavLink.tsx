import type { ReactNode } from 'react';
import { NavLink, useLocation, type NavLinkProps } from 'react-router-dom';

type CampusNavLinkProps = Omit<NavLinkProps, 'children'> & {
  children: ReactNode;
  matchPath?: (pathname: string) => boolean;
};

export const CampusNavLink = ({
  className = '',
  children,
  end,
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
      <span className="campus-nav-link__label">{children}</span>
    </NavLink>
  );
};
