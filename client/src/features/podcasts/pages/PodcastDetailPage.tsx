import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AudioPlayer } from '@/features/podcasts/components/AudioPlayer';
import { PodcastCover } from '@/features/podcasts/components/PodcastCover';
import { PodcastStatusBadge } from '@/features/podcasts/components/PodcastStatusBadge';
import {
  canPlayPodcast,
  downloadPodcast,
  fetchPodcastById,
  getPodcastStreamUrl,
  getPodcastVideoStreamUrl,
  hasPodcastVideo,
} from '@/features/podcasts/services/podcast.service';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { formatFileSize } from '@/features/podcasts/utils/formatFileSize';
import { formatPodcastDate } from '@/features/podcasts/utils/formatPodcastDate';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { Alert } from '@/shared/components/campus/Alert';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

export const PodcastDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
    if (!id || !podcast || podcast.status !== 'processing') return;

    const interval = window.setInterval(() => {
      void fetchPodcastById(id)
        .then(setPodcast)
        .catch(() => {});
    }, 5000);

    return () => window.clearInterval(interval);
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
        <div className="campus-panel aspect-[16/9] max-w-3xl animate-pulse bg-campus-border/30" />
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

  return (
    <div className="campus-page-enter space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/podcasts" className="text-sm font-bold text-campus-primary hover:underline">
          ← Biblioteca
        </Link>
        <PodcastStatusBadge status={podcast.status} />
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
            {podcast.originalSize != null && (
              <p>
                <span className="text-campus-muted">Tamanho original:</span>{' '}
                {formatFileSize(podcast.originalSize)}
              </p>
            )}
            {podcast.compressedSize != null && (
              <p>
                <span className="text-campus-muted">Comprimido:</span>{' '}
                {formatFileSize(podcast.compressedSize)}
                {podcast.compressionRatio != null ? ` (−${podcast.compressionRatio}%)` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <PageHeader
            eyebrow={podcast.categoryName}
            title={podcast.title}
            description={podcast.description || 'Sem descrição.'}
          />

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
                <div className="campus-panel overflow-hidden bg-black">
                  <video
                    src={videoStreamUrl}
                    controls
                    className="aspect-video w-full"
                    title={podcast.title}
                  >
                    O teu browser não suporta reprodução de vídeo.
                  </video>
                </div>
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
    </div>
  );
};
