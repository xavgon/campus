import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AudioPlayer } from '@/features/podcasts/components/AudioPlayer';
import { VideoPlayer } from '@/features/podcasts/components/VideoPlayer';
import { PodcastCover } from '@/features/podcasts/components/PodcastCover';
import { AuthorCertBadge } from '@/features/podcasts/components/AuthorCertBadge';
import { CompressionBadge } from '@/features/podcasts/components/CompressionBadge';
import { CompressionDetailPanel } from '@/features/podcasts/components/CompressionDetailPanel';
import { PodcastEditModal } from '@/features/podcasts/components/PodcastEditModal';
import { PodcastStatusBadge } from '@/features/podcasts/components/PodcastStatusBadge';
import {
  canPlayPodcast,
  deletePodcast,
  fetchCompressionProgress,
  fetchPodcastById,
  getPodcastStreamUrl,
  getPodcastVideoStreamUrl,
  hasPodcastVideo,
} from '@/features/podcasts/services/podcast.service';
import { PodcastDownloadPanel } from '@/features/podcasts/components/PodcastDownloadPanel';
import type { CompressionProgress } from '@/features/podcasts/types/compression';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { canManagePodcast } from '@/features/podcasts/utils/canManagePodcast';
import { formatPodcastDate } from '@/features/podcasts/utils/formatPodcastDate';
import { formatDuration } from '@/features/podcasts/utils/formatDuration';
import { formatFileSize } from '@/features/podcasts/utils/formatFileSize';
import { formatMediaFormatLabel } from '@/features/podcasts/utils/formatMediaFormat';
import { getCompressionProfileLabel } from '@/features/podcasts/utils/formatCompressionProfile';
import { getCompressionState } from '@/features/podcasts/utils/compressionState';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { Alert } from '@/shared/components/campus/Alert';
import { Modal } from '@/shared/components/campus/Modal';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { ERROR_TITLES, EMPTY_STATE_COPY, VOD_COPY } from '@/shared/copy/campusMessages';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

export const PodcastDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const publishNotice = (location.state as { notice?: string } | null)?.notice;
  const { user } = useAuth();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const item = await fetchPodcastById(id);
        if (!cancelled) setPodcast(item);
      } catch (err) {
        if (!cancelled) {
          setPodcast(null);
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !podcast) return;

    const shouldPoll =
      podcast.status === 'processing' ||
      podcast.compressedSize == null;

    if (!shouldPoll) {
      setCompressionProgress(null);
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const poll = async () => {
      try {
        const [item, progress] = await Promise.all([
          fetchPodcastById(id),
          fetchCompressionProgress(id),
        ]);
        if (cancelled) return;

        setPodcast(item);
        setCompressionProgress(progress);

        const finished =
          item.compressedSize != null &&
          (progress == null || !progress.active);

        if (finished && intervalId) {
          window.clearInterval(intervalId);
          intervalId = undefined;
          setCompressionProgress(null);
        }
      } catch {
        // mantém último estado conhecido
      }
    };

    void poll();
    intervalId = window.setInterval(() => void poll(), 2000);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [id, podcast?.id, podcast?.status, podcast?.compressedSize]);

  if (!id) {
    return (
      <div className="campus-page-enter">
        <Alert title={ERROR_TITLES.podcastInvalid} message={EMPTY_STATE_COPY.podcastInvalidId} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="campus-page-enter space-y-6">
        <div className="h-8 w-48 animate-pulse bg-campus-border/40" />
        <div className="campus-panel aspect-video max-w-3xl animate-pulse bg-campus-border/30" />
        <div className="campus-panel h-40 max-w-3xl animate-pulse bg-campus-border/20" />
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="campus-page-enter space-y-6">
        <Alert
          title={ERROR_TITLES.podcastNotFound}
          message={error ?? EMPTY_STATE_COPY.podcastLoadFailed}
        />
        <Link to="/podcasts">
          <Button variant="outline">← Voltar à biblioteca</Button>
        </Link>
      </div>
    );
  }

  const streamUrl = getPodcastStreamUrl(podcast.id);
  const videoStreamUrl = getPodcastVideoStreamUrl(podcast.id);
  const withVideo = hasPodcastVideo(podcast);
  const playable = canPlayPodcast(podcast) && (withVideo ? videoStreamUrl : streamUrl);
  const canManage = canManagePodcast(user, podcast);
  const compressionState = getCompressionState(podcast, compressionProgress);

  const onConfirmDelete = async () => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deletePodcast(podcast.id);
      navigate('/podcasts', { replace: true });
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="campus-page-enter space-y-8">
      {publishNotice && (
        <ProfileNotice title="Episódio publicado" message={publishNotice} variant="success" />
      )}
      {playable && !publishNotice && (
        <ProfileNotice
          title={VOD_COPY.onDemandTitle}
          message={VOD_COPY.onDemandMessage}
          variant="info"
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/podcasts" className="text-sm font-bold text-campus-primary hover:underline">
          ← Biblioteca
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <PodcastStatusBadge status={podcast.status} />
          <CompressionBadge state={compressionState} />
          {canManage && (
            <>
              <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-campus-danger hover:bg-campus-danger/10"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
              >
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <div className="campus-panel overflow-hidden">
          <div className="relative aspect-square border-b border-campus-border/60 bg-black/40">
            <PodcastCover podcast={podcast} />
          </div>
          <div className="space-y-2 p-5 text-sm text-campus-accent">
            <p>
              <span className="text-campus-muted">Autor:</span> {podcast.authorName}
            </p>
            <AuthorCertBadge
              cn={podcast.authorCertCn}
              fingerprint={podcast.authorCertFingerprint}
            />
            <p>
              <span className="text-campus-muted">Categoria:</span> {podcast.categoryName}
            </p>
            {podcast.durationSeconds > 0 && (
              <p>
                <span className="text-campus-muted">Duração:</span>{' '}
                {formatDuration(podcast.durationSeconds)}
              </p>
            )}
            {podcast.originalSize != null && (
              <p>
                <span className="text-campus-muted">Tamanho:</span>{' '}
                {formatFileSize(podcast.originalSize)}
                {podcast.compressedSize != null && (
                  <span className="text-campus-muted">
                    {' '}
                    → {formatFileSize(podcast.compressedSize)} comprimido
                  </span>
                )}
              </p>
            )}
            {podcast.mediaFormat && (
              <p>
                <span className="text-campus-muted">Formato comprimido:</span>{' '}
                {getCompressionProfileLabel(podcast.mediaFormat, withVideo ? 'video' : 'audio') ??
                  formatMediaFormatLabel(podcast.mediaFormat)}
              </p>
            )}
            <p>
              <span className="text-campus-muted">Publicado:</span> {formatPodcastDate(podcast.createdAt)}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <PageHeader
            eyebrow={podcast.categoryName}
            title={podcast.title}
            description={podcast.description || 'Sem descrição.'}
          />

          <CompressionDetailPanel podcast={podcast} progress={compressionProgress} />

          {(podcast.status === 'processing' || compressionProgress?.active) && (
            <ProfileNotice
              title="A processar"
              message="O áudio está a ser comprimido. Podes ouvir a versão original; a qualidade optimizada ficará disponível em breve."
              variant="info"
            />
          )}

          {playable ? (
            <div className="space-y-4">
              {withVideo && videoStreamUrl ? (
                <VideoPlayer
                  src={videoStreamUrl}
                  title={podcast.title}
                  poster={podcast.coverUrl}
                  knownDurationSeconds={podcast.durationSeconds}
                />
              ) : streamUrl ? (
                <AudioPlayer
                  src={streamUrl}
                  title={podcast.title}
                  knownDurationSeconds={podcast.durationSeconds}
                />
              ) : null}
              <PodcastDownloadPanel podcast={podcast} withVideo={withVideo} />
            </div>
          ) : (
            <ProfileNotice
              title="Áudio indisponível"
              message="Este episódio ainda não tem ficheiro de áudio pronto para reprodução."
              variant="info"
            />
          )}
        </div>
      </div>

      <PodcastEditModal
        open={editOpen}
        podcast={podcast}
        onClose={() => setEditOpen(false)}
        onSaved={setPodcast}
      />

      <Modal
        open={deleteOpen}
        onClose={() => !isDeleting && setDeleteOpen(false)}
        title="Eliminar episódio"
        description="Esta acção é permanente. O áudio, vídeo e capa serão removidos do servidor."
      >
        <div className="space-y-4">
          <p className="text-sm text-campus-accent">
            Tens a certeza que queres eliminar <strong className="text-campus-foreground">{podcast.title}</strong>?
          </p>
          {deleteError && <Alert title={ERROR_TITLES.delete} message={deleteError} />}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-campus-danger text-white hover:bg-campus-danger/90"
              onClick={() => void onConfirmDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? 'A eliminar…' : 'Eliminar episódio'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
