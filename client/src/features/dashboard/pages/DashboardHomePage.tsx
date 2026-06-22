import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { isAdminUser } from '@/features/auth/utils/isAdmin';
import { getDashboardShortcuts } from '@/features/dashboard/constants';
import { DashboardAttentionList } from '@/features/dashboard/components/DashboardAttentionList';
import { DashboardOverviewStats } from '@/features/dashboard/components/DashboardOverviewStats';
import { DashboardRecentItem } from '@/features/dashboard/components/DashboardRecentItem';
import { DashboardShortcutCard } from '@/features/dashboard/components/DashboardShortcutCard';
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton';
import { DashboardWelcome } from '@/features/dashboard/components/DashboardWelcome';
import { DashboardOnlinePanel } from '@/features/dashboard/components/DashboardOnlinePanel';
import { useDashboardSummary } from '@/features/dashboard/hooks/useDashboardSummary';
import { useOnlineSnapshot } from '@/features/presence/hooks/useOnlineSnapshot';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { BRAND } from '@/shared/styles/brand';
import { Button } from '@/shared/components/ui/Button';

export const DashboardHomePage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { stats, recent, needsAttention, isLoading: summaryLoading } = useDashboardSummary();
  const {
    snapshot: onlineSnapshot,
    isLoading: onlineLoading,
    error: onlineError,
  } = useOnlineSnapshot(!!user);

  if (authLoading || summaryLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-campus-muted">
        A carregar área pessoal…
      </div>
    );
  }

  const hasEpisodes = stats.total > 0;

  return (
    <div className="campus-page-enter space-y-8">
      <DashboardWelcome user={user} />

      <DashboardOnlinePanel
        count={onlineSnapshot.count}
        users={onlineSnapshot.users}
        isLoading={onlineLoading}
        hasError={onlineError}
      />

      {isAdminUser(user) && (
        <div className="campus-panel flex flex-col gap-3 border-campus-primary/30 bg-campus-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-campus-primary">
              Administração
            </p>
            <p className="mt-1 text-sm text-campus-accent">
              Gestão de utilizadores, publicações e transmissões da plataforma.
            </p>
          </div>
          <Link to="/admin">
            <Button variant="primary" className="w-full sm:w-auto">
              Abrir painel admin
            </Button>
          </Link>
        </div>
      )}

      {hasEpisodes ? (
        <DashboardOverviewStats {...stats} />
      ) : (
        <ProfileNotice
          title="Começa a publicar"
          message="Ainda não tens episódios na biblioteca. O teu resumo de estatísticas aparece aqui depois da primeira publicação."
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <section className="lg:col-span-2">
          <div className="campus-panel p-5 sm:p-6">
            <header className="mb-2 flex flex-wrap items-end justify-between gap-3 border-b border-campus-border/60 pb-4">
              <div>
                <h2 className="text-lg font-bold text-campus-foreground">Episódios recentes</h2>
                <p className="mt-1 text-sm text-campus-accent">
                  Os últimos que adicionaste ou actualizaste.
                </p>
              </div>
              {hasEpisodes && (
                <Link
                  to="/podcasts"
                  className="text-sm font-bold text-campus-primary hover:underline"
                >
                  Ver todos
                </Link>
              )}
            </header>

            {hasEpisodes ? (
              <ul>
                {recent.map((podcast) => (
                  <DashboardRecentItem key={podcast.id} podcast={podcast} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-campus-muted">
                Publica o primeiro episódio para o veres aqui.
              </p>
            )}
          </div>

          {needsAttention.length > 0 && (
            <div className="mt-6">
              <DashboardAttentionList items={needsAttention} />
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="campus-panel border-campus-primary/20 bg-campus-primary/5 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-campus-primary">
              {BRAND.name}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-campus-accent">{BRAND.tagline}</p>
            <p className="mt-3 text-xs text-campus-muted">{BRAND.description}</p>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-campus-muted">
              Atalhos
            </h2>
            <div className="flex flex-col gap-3">
              {getDashboardShortcuts(user).map((shortcut) => (
                <DashboardShortcutCard key={shortcut.to} shortcut={shortcut} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
