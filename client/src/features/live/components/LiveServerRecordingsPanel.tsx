import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchServerLiveRecordings,
  publishServerLiveRecording,
} from '@/features/live/services/live.service';
import type { ServerLiveRecording } from '@/features/live/types/live.types';
import { Alert } from '@/shared/components/campus/Alert';
import { CampusPagination } from '@/shared/components/campus/CampusPagination';
import { getApiErrorMessage } from '@/shared/api/client';
import { LIST_PAGE_SIZE } from '@/shared/constants/pagination';
import { ERROR_TITLES, VOD_COPY } from '@/shared/copy/campusMessages';
import { useClientPagination } from '@/shared/hooks/useClientPagination';
import { Button } from '@/shared/components/ui/Button';

export const LiveServerRecordingsPanel = () => {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<ServerLiveRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setRecordings(await fetchServerLiveRecordings());
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { items: visibleRecordings, page, setPage, totalPages } = useClientPagination(
    recordings,
    LIST_PAGE_SIZE,
  );

  const onPublish = async (rec: ServerLiveRecording) => {
    if (rec.publishedPodcastId || publishingId) return;
    setPublishingId(rec.id);
    setError(null);
    try {
      const podcast = await publishServerLiveRecording(rec.id, {
        title: `${rec.title} (VOD)`,
        description: 'Episódio publicado a partir da gravação da transmissão ao vivo.',
      });
      void navigate(`/podcasts/${podcast.id}`, {
        state: { notice: VOD_COPY.livePublishedNotice },
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPublishingId(null);
    }
  };

  if (loading) {
    return (
      <div className="campus-panel p-6 text-sm text-campus-muted">
        A carregar gravações do servidor…
      </div>
    );
  }

  if (recordings.length === 0) {
    return null;
  }

  return (
    <section className="campus-panel space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold text-campus-foreground">Gravações VOD (servidor)</h2>
        <p className="mt-1 text-sm text-campus-accent">
          Após uma transmissão, o FFmpeg guarda áudio/vídeo no servidor. Publica aqui como episódio
          sob demanda na biblioteca.
        </p>
      </div>

      {error && <Alert title={ERROR_TITLES.livePublishRecording} message={error} />}

      <ul className="divide-y divide-campus-border/60">
        {visibleRecordings.map((rec) => (
          <li
            key={rec.id}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-campus-foreground">{rec.title}</p>
              <p className="mt-1 text-xs text-campus-muted">
                {rec.durationSeconds}s · {rec.mediaType}
                {rec.hasVideo ? ' · vídeo' : ''}
                {rec.publishedPodcastId ? ' · já publicado' : ''}
              </p>
            </div>
            {rec.publishedPodcastId ? (
              <Button type="button" variant="outline" disabled>
                Publicado
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                disabled={!rec.hasAudio || publishingId === rec.id}
                onClick={() => void onPublish(rec)}
              >
                {publishingId === rec.id ? 'A publicar…' : 'Publicar VOD'}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <CampusPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        ariaLabel="Paginação de gravações"
        className="border-t border-campus-border/50 pt-4"
      />
    </section>
  );
};
