import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canPublishPodcasts } from '@/features/auth/utils/canPublish';
import { LiveSessionCard } from '@/features/live/components/LiveSessionCard';
import { LiveServerRecordingsPanel } from '@/features/live/components/LiveServerRecordingsPanel';
import { useActiveLives } from '@/features/live/hooks/useActiveLives';
import { Alert } from '@/shared/components/campus/Alert';
import { CampusPagination } from '@/shared/components/campus/CampusPagination';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { Button } from '@/shared/components/ui/Button';
import { LIST_PAGE_SIZE } from '@/shared/constants/pagination';
import { ERROR_TITLES } from '@/shared/copy/campusMessages';
import { useClientPagination } from '@/shared/hooks/useClientPagination';

export const LiveHubPage = () => {
  const { user } = useAuth();
  const canBroadcast = canPublishPodcasts(user);
  const { sessions, isLoading, error, refresh } = useActiveLives();
  const { items: visibleSessions, page, setPage, totalPages } = useClientPagination(
    sessions,
    LIST_PAGE_SIZE,
  );

  return (
    <div className="campus-page-enter space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Transmissões"
          title="Ao vivo agora"
          description="Entra nas emissões em curso ou inicia a tua própria transmissão."
        />
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => void refresh()}>
            Actualizar
          </Button>
          {canBroadcast && (
            <Link to="/live/broadcast">
              <Button>Iniciar transmissão</Button>
            </Link>
          )}
        </div>
      </div>

      {error && <Alert title={ERROR_TITLES.load} message={error} />}

      {isLoading && (
        <div className="campus-panel p-8 text-center text-sm text-campus-muted">A procurar transmissões…</div>
      )}

      {!isLoading && sessions.length === 0 && (
        <div className="campus-panel flex flex-col items-center px-6 py-14 text-center">
          <p className="text-lg font-bold text-campus-foreground">Nenhuma transmissão em direto</p>
          <p className="mt-2 max-w-md text-sm text-campus-accent">
            Quando um criador iniciar uma emissão, aparece aqui automaticamente.
          </p>
          {canBroadcast && (
            <Link to="/live/broadcast" className="mt-6">
              <Button>Ser o primeiro a transmitir</Button>
            </Link>
          )}
        </div>
      )}

      {!isLoading && sessions.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleSessions.map((session) => (
              <LiveSessionCard key={session.id} session={session} />
            ))}
          </div>
          <CampusPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Paginação de transmissões"
            className="border-t border-campus-border/50 pt-4"
          />
        </div>
      )}

      {canBroadcast && <LiveServerRecordingsPanel />}
    </div>
  );
};
