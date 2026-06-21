import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePresenceSession } from '@/features/presence/hooks/usePresenceSession';
import { CampusNav } from '@/shared/components/campus/CampusNav';
import { DesktopSidebar } from '@/shared/components/campus/DesktopSidebar';
import { TriangleMeshBackground } from '@/shared/components/campus/TriangleMeshBackground';
import { RouteTransition } from '@/shared/components/campus/RouteTransition';
import { BRAND } from '@/shared/styles/brand';
import { IS_ELECTRON } from '@/shared/utils/isElectron';

export const MainLayout = () => {
  const { pathname } = useLocation();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  usePresenceSession();

  if (IS_ELECTRON) {
    return (
      <div className="flex h-screen overflow-hidden bg-campus-surface-dark">
        {!isLoading && isAuthenticated && user ? (
          <DesktopSidebar user={user} onLogout={logout} />
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="campus-desktop-main flex-1 overflow-y-auto px-6 py-6">
            <RouteTransition routeKey={pathname}>
              <Outlet />
            </RouteTransition>
          </main>
          <footer className="shrink-0 border-t border-campus-border bg-campus-surface-elevated px-4 py-2 text-center text-xs text-campus-muted">
            {BRAND.name} · {BRAND.year}
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-campus-surface-dark">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute inset-0 bg-campus-surface-dark" />
        <div className="absolute inset-0 z-1 bg-linear-to-b from-black/70 via-campus-surface-dark/80 to-black/88" />
        <TriangleMeshBackground />
      </div>
      <CampusNav />
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <RouteTransition routeKey={pathname}>
          <Outlet />
        </RouteTransition>
      </main>
      <footer className="relative z-10 border-t border-campus-border py-6 text-center text-sm text-campus-muted">
        © {new Date().getFullYear()} {BRAND.name} — {BRAND.year}
      </footer>
    </div>
  );
};
