import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LIVE_MEDIA_OPTIONS, LIVE_VIDEO_HEIGHT, LIVE_VIDEO_WIDTH } from '@/features/live/constants';
import { SaveLiveEpisodePanel } from '@/features/live/components/SaveLiveEpisodePanel';
import { useLiveBroadcast } from '@/features/live/hooks/useLiveBroadcast';
import { useScheduledStreams } from '@/features/live/hooks/useScheduledStreams';
import type { LiveMediaType } from '@/features/live/types/live.types';
import { wantsLiveVideo } from '@/features/live/utils/liveMedia';
import { Alert } from '@/shared/components/campus/Alert';
import { Field } from '@/shared/components/campus/Field';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { Button } from '@/shared/components/ui/Button';

export const LiveBroadcastPage = () => {
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<LiveMediaType>('audio');
  const [scheduledId, setScheduledId] = useState('');
  const { streams: scheduledStreams } = useScheduledStreams();
  const {
    phase,
    liveId,
    listenersCount,
    error,
    recording,
    broadcastTitle,
    startedAtMs,
    previewRef,
    start,
    stop,
    discardRecording,
  } = useLiveBroadcast();

  const isOnAir = phase === 'live' || phase === 'connecting';
  const showStartForm = phase === 'idle' || phase === 'error';
  const showSavePanel = phase === 'ended' && recording != null;

  const showPreview = wantsLiveVideo(mediaType) && (isOnAir || showSavePanel);

  useEffect(() => {
    if (!scheduledId) return;
    const picked = scheduledStreams.find((s) => s.id === scheduledId);
    if (picked) setTitle(picked.title);
  }, [scheduledId, scheduledStreams]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || isOnAir) return;
    void start(title, mediaType, scheduledId || undefined);
  };

  const onStop = () => {
    void stop();
  };

  return (
    <div className="campus-page-enter mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Broadcaster"
        title="Transmitir ao vivo"
        description="Partilha áudio ou vídeo em tempo real. Ao terminar, podes publicar a gravação como episódio."
      />

      {phase === 'live' && liveId && (
        <ProfileNotice
          title="Em direto"
          message={`ID: ${liveId} · ${listenersCount} ouvinte${listenersCount === 1 ? '' : 's'} · gravação local activa`}
          variant="success"
        />
      )}

      {error && <Alert title="Transmissão interrompida" message={error} />}

      {showPreview && (
        <div className="campus-panel overflow-hidden p-3">
          <canvas
            ref={previewRef}
            width={LIVE_VIDEO_WIDTH}
            height={LIVE_VIDEO_HEIGHT}
            className="mx-auto w-full max-w-full bg-black object-contain"
            aria-label="Pré-visualização da câmara"
          />
        </div>
      )}

      {showSavePanel ? (
        <SaveLiveEpisodePanel
          defaultTitle={broadcastTitle || title}
          recording={recording}
          startedAtMs={startedAtMs}
          onDiscard={discardRecording}
        />
      ) : showStartForm ? (
        <form onSubmit={onSubmit} className="campus-panel space-y-5 p-6">
          {scheduledStreams.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="scheduledStream" className="text-sm font-medium text-campus-foreground">
                Transmissão agendada (opcional)
              </label>
              <select
                id="scheduledStream"
                className="w-full rounded-none border border-campus-border bg-campus-surface-elevated px-4 py-3 text-sm text-campus-foreground outline-none focus:border-campus-primary focus:ring-2 focus:ring-campus-primary/30"
                value={scheduledId}
                onChange={(e) => setScheduledId(e.target.value)}
              >
                <option value="">Nova transmissão espontânea</option>
                {scheduledStreams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.title}
                    {stream.scheduled_at
                      ? ` — ${new Date(stream.scheduled_at).toLocaleString('pt-PT')}`
                      : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-campus-muted">
                Escolhe uma transmissão criada no painel admin para a activar em direto.
              </p>
            </div>
          )}

          <Field
            label="Título da transmissão"
            name="liveTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Aula de História — revisão"
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="mediaType" className="text-sm font-medium text-campus-foreground">
              Formato da transmissão
            </label>
            <select
              id="mediaType"
              className="w-full rounded-none border border-campus-border bg-campus-surface-elevated px-4 py-3 text-sm text-campus-foreground outline-none focus:border-campus-primary focus:ring-2 focus:ring-campus-primary/30"
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as LiveMediaType)}
            >
              {LIVE_MEDIA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-campus-muted">
            O browser vai pedir permissão para o microfone{wantsLiveVideo(mediaType) ? ' e câmara' : ''}.
            A gravação fica no teu dispositivo até publicares o episódio.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!title.trim()}>
              Iniciar transmissão
            </Button>
            <Link to="/live">
              <Button type="button" variant="outline">
                Voltar
              </Button>
            </Link>
          </div>
        </form>
      ) : isOnAir ? (
        <div className="campus-panel space-y-4 p-6">
          {phase === 'connecting' && (
            <p className="text-sm text-campus-accent">A ligar ao servidor de transmissão…</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={onStop}>
              Terminar transmissão
            </Button>
            {liveId && (
              <Link to={`/live/${liveId}`}>
                <Button type="button" variant="ghost">
                  Abrir como ouvinte
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : phase === 'ended' && !recording ? (
        <div className="campus-panel space-y-4 p-6">
          <p className="text-sm text-campus-accent">
            Transmissão terminada sem gravação guardada (demasiado curta ou permissões revogadas).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={discardRecording}>
              Nova transmissão
            </Button>
            <Link to="/live">
              <Button type="button" variant="outline">
                Voltar ao hub
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};
