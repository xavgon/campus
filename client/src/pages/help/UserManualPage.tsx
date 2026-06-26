import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ManualSectionCard } from '@/features/help/components/ManualSectionCard';
import type { ManualAudience } from '@/shared/copy/userManual';
import { MANUAL_PAGE, MANUAL_SECTIONS } from '@/shared/copy/userManual';
import { isAdminUser } from '@/features/auth/utils/isAdmin';
import { canPublishPodcasts } from '@/features/auth/utils/canPublish';

const audienceForUser = (
  isAuthenticated: boolean,
  isCreator: boolean,
  isAdmin: boolean,
): ManualAudience => {
  if (isAdmin) return 'admin';
  if (isCreator) return 'creator';
  if (isAuthenticated) return 'user';
  return 'visitor';
};

const sectionMatchesAudience = (
  sectionAudiences: ManualAudience[],
  userAudience: ManualAudience,
): boolean =>
  sectionAudiences.includes('all') || sectionAudiences.includes(userAudience);

export const UserManualPage = () => {
  const { hash } = useLocation();
  const { isAuthenticated, user } = useAuth();
  const isCreator = canPublishPodcasts(user);
  const isAdmin = isAdminUser(user);
  const userAudience = audienceForUser(isAuthenticated, isCreator, isAdmin);

  const sections = useMemo(
    () => MANUAL_SECTIONS.filter((section) => sectionMatchesAudience(section.audience, userAudience)),
    [userAudience],
  );

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [hash]);

  return (
    <div className="campus-page-enter w-full space-y-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-campus-primary">
          {MANUAL_PAGE.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-campus-foreground sm:text-4xl">
          {MANUAL_PAGE.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-campus-accent sm:text-base">
          {MANUAL_PAGE.description}
        </p>
        <p className="mt-2 text-xs text-campus-muted">Actualizado em {MANUAL_PAGE.updated}</p>
        {isAuthenticated && user && (
          <p className="mt-4 rounded-none border border-campus-primary/30 bg-campus-primary/5 px-4 py-3 text-sm text-campus-accent">
            Estás a ver o manual como{' '}
            <span className="font-bold text-campus-primary">
              {isAdmin ? 'administrador' : isCreator ? 'criador' : 'utilizador'}
            </span>
            . As secções irrelevantes para o teu papel estão ocultas.
          </p>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <nav
          className="campus-panel sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto p-4 lg:block"
          aria-label="Índice do manual"
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-campus-muted">
            Índice
          </p>
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-none px-2 py-1.5 text-sm text-campus-accent transition hover:bg-black/30 hover:text-campus-primary"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-campus-border/50 pt-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/'}
              className="text-xs font-bold text-campus-primary hover:underline"
            >
              ← Voltar à plataforma
            </Link>
          </div>
        </nav>

        <div className="space-y-6">
          <nav className="campus-panel flex flex-wrap gap-2 p-3 lg:hidden" aria-label="Índice móvel">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-none border border-campus-border/70 px-2 py-1 text-xs font-semibold text-campus-accent hover:border-campus-primary/40"
              >
                {section.title}
              </a>
            ))}
          </nav>

          {sections.map((section) => (
            <ManualSectionCard key={section.id} section={section} />
          ))}

          <footer className="campus-panel border-dashed p-5 text-center text-sm text-campus-muted">
            <p>Precisas de ajuda técnica adicional? Consulta a documentação do projecto ou fala com o administrador da plataforma.</p>
            <Link to={isAuthenticated ? '/profile' : '/login'} className="mt-3 inline-block font-bold text-campus-primary hover:underline">
              {isAuthenticated ? 'Ir ao perfil' : 'Iniciar sessão'}
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
};
