import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AudioPlayer } from '@/features/podcasts/components/AudioPlayer';
import { VideoPlayer } from '@/features/podcasts/components/VideoPlayer';
import { PodcastCover } from '@/features/podcasts/components/PodcastCover';
import { CompressionBadge } from '@/features/podcasts/components/CompressionBadge';
import { CompressionDetailPanel } from '@/features/podcasts/components/CompressionDetailPanel';
import { PodcastEditModal } from '@/features/podcasts/components/PodcastEditModal';
import { PodcastStatusBadge } from '@/features/podcasts/components/PodcastStatusBadge';
import {
  canPlayPodcast,
  deletePodcast,
  downloadPodcast,
  fetchCompressionProgress,
  fetchPodcastById,
  getPodcastStreamUrl,
  getPodcastVideoStreamUrl,
  hasPodcastVideo,
} from '@/features/podcasts/services/podcast.service';
import type { CompressionProgress } from '@/features/podcasts/types/compression';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { canManagePodcast } from '@/features/podcasts/utils/canManagePodcast';
import { formatPodcastDate } from '@/features/podcasts/utils/formatPodcastDate';
import { getCompressionState } from '@/features/podcasts/utils/compressionState';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { Alert } from '@/shared/components/campus/Alert';
import { Modal } from '@/shared/components/campus/Modal';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

export const PodcastDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
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
    if (!id || !podcast || podcast.status !== 'processing') {
      setCompressionProgress(null);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const [item, progress] = await Promise.all([
          fetchPodcastById(id),
          fetchCompressionProgress(id),
        ]);
        if (cancelled) return;
        setPodcast(item);
        setCompressionProgress(progress);
      } catch {
        // mantém último estado conhecido
      }
    };

    void poll();
    const interval = window.setInterval(() => void poll(), 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [id, podcast?.status]);

  if (!id) {
    return (
      <div className="campus-page-enter">
        <Alert title="Episódio inválido" message="Identificador em falta." />
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
        <Alert title="Episódio não encontrado" message={error ?? 'Não foi possível carregar o episódio.'} />
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
  const compressionState = getCompressionState(podcast);

  const onDownload = async () => {
    setDownloadError(null);
    setIsDownloading(true);
    try {
      await downloadPodcast(podcast);
    } catch (err) {
      setDownloadError(getApiErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  };

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
            <p>
              <span className="text-campus-muted">Categoria:</span> {podcast.categoryName}
            </p>
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

          {podcast.status === 'processing' && (
            <ProfileNotice
              title="A processar"
              message="O áudio está a ser comprimido. Podes ouvir a versão original; a qualidade optimizada ficará disponível em breve."
              variant="info"
            />
          )}

          {playable ? (
            <div className="space-y-4">
              {withVideo && videoStreamUrl ? (
                <VideoPlayer src={videoStreamUrl} title={podcast.title} poster={podcast.coverUrl} />
              ) : streamUrl ? (
                <AudioPlayer src={streamUrl} title={podcast.title} />
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                {!withVideo && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void onDownload()}
                      disabled={isDownloading}
                    >
                      {isDownloading ? 'A descarregar…' : 'Descarregar episódio'}
                    </Button>
                    <p className="text-xs text-campus-muted">
                      Guarda o áudio no dispositivo para ouvir offline.
                    </p>
                  </>
                )}
                {withVideo && (
                  <p className="text-xs text-campus-muted">
                    Episódio com vídeo e áudio integrado. O áudio comprimido fica disponível para
                    podcasts só de áudio após o processamento.
                  </p>
                )}
              </div>
              {downloadError && <Alert title="Download falhou" message={downloadError} />}
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
          {deleteError && <Alert title="Não foi possível eliminar" message={deleteError} />}
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
