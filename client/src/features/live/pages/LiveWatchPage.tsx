import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LiveCommentsPanel } from '@/features/live/components/LiveCommentsPanel';
import { LIVE_VIDEO_HEIGHT, LIVE_VIDEO_WIDTH } from '@/features/live/constants';
import { useLiveListener } from '@/features/live/hooks/useLiveListener';
import { fetchLiveComments } from '@/features/live/services/live.service';
import type { LiveComment } from '@/features/live/types/live.types';
import { formatLiveDuration } from '@/features/live/utils/liveMedia';
import { Alert } from '@/shared/components/campus/Alert';
import { ERROR_TITLES, LIVE_COPY } from '@/shared/copy/campusMessages';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { Button } from '@/shared/components/ui/Button';

export const LiveWatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const {
    phase,
    session,
    error,
    needsAudioUnlock,
    showVideo,
    comments,
    commentError,
    attachViewerCanvas,
    unlockAudio,
    retry,
    sendComment,
  } = useLiveListener(id);

  const [archivedComments, setArchivedComments] = useState<LiveComment[]>([]);

  useEffect(() => {
    if (phase !== 'ended' || !id) return;
    void fetchLiveComments(id)
      .then(setArchivedComments)
      .catch(() => setArchivedComments([]));
  }, [phase, id]);

  const canComment = phase === 'watching' || phase === 'reconnecting';
  const showLiveLayout = canComment && session;

  return (
    <div className="campus-page-enter mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="Transmissão"
          title={session?.title ?? 'Ao vivo'}
          description={
            session
              ? `${session.hostEmail} · ${formatLiveDuration(session.startedAt)}`
              : 'A ligar à emissão…'
          }
        />
        <Link to="/live">
          <Button variant="outline">← Voltar</Button>
        </Link>
      </div>

      {error && (
        <div className="space-y-3">
          <Alert title={ERROR_TITLES.liveWatch} message={error} />
          <Button type="button" onClick={retry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {phase === 'connecting' && (
        <div className="campus-panel p-10 text-center text-sm text-campus-muted">
          A estabelecer ligação…
        </div>
      )}

      {phase === 'reconnecting' && !session && (
        <div className="campus-panel p-10 text-center text-sm text-campus-muted">
          {LIVE_COPY.listenerWaitingHost}
        </div>
      )}

      {phase === 'ended' && (
        <div className="space-y-6">
          <div className="campus-panel p-10 text-center">
            <p className="text-lg font-bold text-campus-foreground">A transmissão terminou</p>
            <Link to="/live" className="mt-4 inline-block">
              <Button variant="outline">Ver outras emissões</Button>
            </Link>
          </div>
          {archivedComments.length > 0 && (
            <LiveCommentsPanel comments={archivedComments} onSend={() => {}} readOnly />
          )}
        </div>
      )}

      {showLiveLayout && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-none border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" aria-hidden />
              {phase === 'reconnecting' ? 'A reconectar' : 'Em direto'}
            </div>

            {phase === 'reconnecting' && (
              <p className="text-sm text-campus-muted">
                O anfitrião perdeu a ligação momentaneamente. Os comentários continuam disponíveis.
              </p>
            )}

            {showVideo && (
              <div className="campus-panel overflow-hidden p-3">
                <canvas
                  ref={attachViewerCanvas}
                  width={LIVE_VIDEO_WIDTH}
                  height={LIVE_VIDEO_HEIGHT}
                  className="mx-auto w-full max-w-full bg-black object-contain"
                  aria-label="Vídeo da transmissão"
                />
              </div>
            )}

            {!showVideo && (
              <div className="campus-panel flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-campus-primary/40 bg-campus-primary/10"
                  aria-hidden
                >
                  <svg className="h-10 w-10 text-campus-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </div>
                <p className="text-sm text-campus-accent">Transmissão só de áudio em curso</p>
              </div>
            )}

            {needsAudioUnlock && (
              <div className="campus-panel flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
                <p className="text-sm text-campus-accent">
                  O browser bloqueou o áudio. Clica para activar a reprodução.
                </p>
                <Button type="button" onClick={() => void unlockAudio()}>
                  Activar áudio
                </Button>
              </div>
            )}
          </div>

          <LiveCommentsPanel
            comments={comments}
            onSend={sendComment}
            commentError={commentError}
            disabled={!canComment}
          />
        </div>
      )}
    </div>
  );
};
