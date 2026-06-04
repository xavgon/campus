import { Outlet, useLocation } from 'react-router-dom';
import { usePresenceSession } from '@/features/presence/hooks/usePresenceSession';
import { CampusNav } from '@/shared/components/campus/CampusNav';
import { TriangleMeshBackground } from '@/shared/components/campus/TriangleMeshBackground';
import { RouteTransition } from '@/shared/components/campus/RouteTransition';
import { BRAND } from '@/shared/styles/brand';

export const MainLayout = () => {
  const { pathname } = useLocation();
  usePresenceSession();

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
