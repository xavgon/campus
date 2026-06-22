import { Link, useParams } from 'react-router-dom';
import { LIVE_VIDEO_HEIGHT, LIVE_VIDEO_WIDTH } from '@/features/live/constants';
import { useLiveListener } from '@/features/live/hooks/useLiveListener';
import { formatLiveDuration } from '@/features/live/utils/liveMedia';
import { Alert } from '@/shared/components/campus/Alert';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { Button } from '@/shared/components/ui/Button';

export const LiveWatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const { phase, session, error, needsAudioUnlock, showVideo, attachViewerCanvas, unlockAudio } =
    useLiveListener(id);

  return (
    <div className="campus-page-enter mx-auto max-w-4xl space-y-8">
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

      {error && <Alert title="Não foi possível ver" message={error} />}

      {phase === 'connecting' && (
        <div className="campus-panel p-10 text-center text-sm text-campus-muted">
          A estabelecer ligação…
        </div>
      )}

      {phase === 'ended' && (
        <div className="campus-panel p-10 text-center">
          <p className="text-lg font-bold text-campus-foreground">A transmissão terminou</p>
          <Link to="/live" className="mt-4 inline-block">
            <Button variant="outline">Ver outras emissões</Button>
          </Link>
        </div>
      )}

      {phase === 'watching' && session && (
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-none border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" aria-hidden />
            Em direto
          </div>

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
      )}
    </div>
  );
};
