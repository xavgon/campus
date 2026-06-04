import { Link, Outlet, useLocation } from 'react-router-dom';
import { ADMIN_NAV_ITEMS } from '@/features/admin/constants';
import { Button } from '@/shared/components/ui/Button';

export const AdminLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="campus-page-enter">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-campus-primary">
            Administração
          </p>
          <p className="mt-1 text-sm text-campus-accent">
            Gestão da plataforma CAMPUS — acesso restrito
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="!py-2 text-xs">
            ← Área pessoal
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8">
        <aside className="campus-panel h-fit p-3 sm:p-4">
          <nav className="flex flex-col gap-1" aria-label="Administração">
            {ADMIN_NAV_ITEMS.map((item) => {
              const active = item.end
                ? pathname === item.to
                : pathname === item.to || pathname.startsWith(`${item.to}/`);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-none border px-3 py-3 transition ${
                    active
                      ? 'border-campus-primary/50 bg-campus-primary/10'
                      : 'border-transparent hover:border-campus-border/60 hover:bg-black/25'
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${active ? 'text-campus-primary' : 'text-campus-foreground'}`}
                  >
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-campus-muted">
                    {item.description}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
