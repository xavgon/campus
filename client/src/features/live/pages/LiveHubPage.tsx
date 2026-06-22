import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canPublishPodcasts } from '@/features/auth/utils/canPublish';
import { LiveSessionCard } from '@/features/live/components/LiveSessionCard';
import { useActiveLives } from '@/features/live/hooks/useActiveLives';
import { Alert } from '@/shared/components/campus/Alert';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { Button } from '@/shared/components/ui/Button';

export const LiveHubPage = () => {
  const { user } = useAuth();
  const canBroadcast = canPublishPodcasts(user);
  const { sessions, isLoading, error, refresh } = useActiveLives();

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

      {error && <Alert title="Não foi possível carregar" message={error} />}

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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => (
            <LiveSessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
};
