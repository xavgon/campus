import { Link, Outlet, useLocation } from 'react-router-dom';
import { CampusNav } from '@/shared/components/campus/CampusNav';
import { FeatureList } from '@/shared/components/campus/FeatureList';
import { PageBackground } from '@/shared/components/campus/PageBackground';
import { RouteTransition } from '@/shared/components/campus/RouteTransition';
import { BRAND } from '@/shared/styles/brand';
import {
  getMarketingBackground,
  isMarketingRoute,
  MARKETING_META,
} from '@/shared/layouts/marketingMeta';
import { IS_ELECTRON } from '@/shared/utils/isElectron';

export const MarketingLayout = () => {
  const { pathname } = useLocation();
  const isExploreCatalog = pathname === '/explorar' || pathname.startsWith('/explorar/');
  const isFullWidthMarketing = isExploreCatalog || pathname === '/ajuda';
  const route = isMarketingRoute(pathname) ? pathname : '/';
  const meta = MARKETING_META[route];
  const background = getMarketingBackground(pathname);

  if (isFullWidthMarketing) {
    return (
      <div
        className={`relative flex flex-col overflow-x-hidden bg-campus-surface-dark ${
          IS_ELECTRON ? 'h-full overflow-y-auto' : 'min-h-screen'
        }`}
      >
        <PageBackground background={background} routeKey={route} />
        <div
          className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-none bg-campus-primary/10 blur-3xl"
          aria-hidden
        />
        {!IS_ELECTRON && <CampusNav />}
        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 lg:py-10">
          <RouteTransition routeKey={route}>
            <Outlet />
          </RouteTransition>
          {isFullWidthMarketing && (
            <footer className="mt-10 border-t border-campus-border/50 py-6 text-center text-sm text-campus-muted">
              <Link to="/ajuda" className="text-campus-primary hover:underline">
                Manual de utilizador
              </Link>
            </footer>
          )}
        </main>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col overflow-x-hidden bg-campus-surface-dark ${
        IS_ELECTRON ? 'h-full overflow-y-auto' : 'min-h-screen'
      }`}
    >
      <PageBackground background={background} routeKey={route} />

      <div
        className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-none bg-campus-primary/10 blur-3xl"
        aria-hidden
      />

      {!IS_ELECTRON && <CampusNav />}

      <div
        className={`relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:gap-16 ${
          IS_ELECTRON ? 'py-6 lg:py-8' : 'lg:py-12'
        }`}
      >
        <aside className={`flex flex-1 flex-col justify-center lg:max-w-xl ${IS_ELECTRON ? 'hidden lg:flex' : ''}`}>
          <RouteTransition routeKey={route} variant="aside">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-campus-primary">
              {meta.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-campus-foreground sm:text-4xl lg:text-5xl">
              {meta.title}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-campus-accent">
              {meta.description}
            </p>
            <p className="mt-6 hidden text-sm text-campus-muted lg:block">{BRAND.year}</p>
            <div className="hidden lg:block">
              <FeatureList />
            </div>
          </RouteTransition>
        </aside>

        <main className="flex flex-1 items-center justify-center lg:justify-end">
          <RouteTransition routeKey={route}>
            <Outlet />
          </RouteTransition>
        </main>
      </div>
    </div>
  );
};
