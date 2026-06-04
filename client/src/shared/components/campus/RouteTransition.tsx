import type { ReactNode } from 'react';

interface RouteTransitionProps {
  routeKey: string;
  children: ReactNode;
  variant?: 'content' | 'aside';
}

export const RouteTransition = ({
  routeKey,
  children,
  variant = 'content',
}: RouteTransitionProps) => (
  <div
    key={routeKey}
    className={variant === 'aside' ? 'campus-aside-enter' : 'campus-route-enter'}
  >
    {children}
  </div>
);
