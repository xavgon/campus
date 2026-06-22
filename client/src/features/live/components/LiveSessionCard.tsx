import { Link } from 'react-router-dom';
import type { LiveSession } from '@/features/live/types/live.types';
import { formatLiveDuration } from '@/features/live/utils/liveMedia';
import { Button } from '@/shared/components/ui/Button';

interface LiveSessionCardProps {
  session: LiveSession;
}

const mediaLabel = (type: LiveSession['mediaType']) => {
  switch (type) {
    case 'audio':
      return 'Áudio';
    case 'video':
      return 'Vídeo';
    case 'both':
      return 'Vídeo + áudio';
    default:
      return type;
  }
};

export const LiveSessionCard = ({ session }: LiveSessionCardProps) => (
  <article className="campus-panel flex flex-col gap-4 p-5 transition hover:border-campus-primary/40">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-1.5 rounded-none border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-red-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" aria-hidden />
          Em direto
        </span>
        <h3 className="mt-2 truncate text-lg font-bold text-campus-foreground">{session.title}</h3>
        <p className="mt-1 text-sm text-campus-accent">{session.hostEmail}</p>
      </div>
      <span className="shrink-0 text-xs text-campus-muted">{formatLiveDuration(session.startedAt)}</span>
    </div>

    <dl className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <dt className="text-campus-muted">Formato</dt>
        <dd className="font-medium text-campus-foreground">{mediaLabel(session.mediaType)}</dd>
      </div>
      <div>
        <dt className="text-campus-muted">Ouvintes</dt>
        <dd className="font-medium text-campus-foreground">{session.listenersCount}</dd>
      </div>
    </dl>

    <Link to={`/live/${session.id}`}>
      <Button fullWidth>Entrar na transmissão</Button>
    </Link>
  </article>
);
