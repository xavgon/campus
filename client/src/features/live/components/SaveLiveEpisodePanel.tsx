import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePodcastCategories } from '@/features/podcasts/hooks/usePodcastCategories';
import { createPodcastFromLive } from '@/features/live/services/liveEpisode.service';
import type { LiveRecordingResult } from '@/features/live/utils/liveMedia';
import {
  formatBlobSize,
  formatRecordingDuration,
  recordingHasAudio,
  recordingHasVideo,
  type LiveEpisodeFormat,
} from '@/features/live/utils/liveRecording';
import { Alert } from '@/shared/components/campus/Alert';
import { Field } from '@/shared/components/campus/Field';
import { TextAreaField } from '@/shared/components/campus/TextAreaField';
import { getApiErrorMessage } from '@/shared/api/client';
import { ERROR_TITLES, LIVE_COPY, VOD_COPY } from '@/shared/copy/campusMessages';
import { Button } from '@/shared/components/ui/Button';

interface SaveLiveEpisodePanelProps {
  defaultTitle: string;
  recording: LiveRecordingResult;
  startedAtMs: number | null;
  onDiscard: () => void;
}

export const SaveLiveEpisodePanel = ({
  defaultTitle,
  recording,
  startedAtMs,
  onDiscard,
}: SaveLiveEpisodePanelProps) => {
  const navigate = useNavigate();
  const { categories, isLoading: categoriesLoading } = usePodcastCategories();
  const hasVideo = recordingHasVideo(recording);
  const hasAudio = recordingHasAudio(recording);

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [format, setFormat] = useState<LiveEpisodeFormat>(hasVideo ? 'audiovideo' : 'audio');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const durationLabel = startedAtMs ? formatRecordingDuration(startedAtMs) : '—';
  const audioSize = recording.audioBlob?.size ?? 0;
  const videoSize = recording.videoBlob?.size ?? 0;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || isSaving) return;

    if (format === 'audio' && !hasAudio) {
      setError(LIVE_COPY.recordingAudioMissing);
      return;
    }
    if (format === 'audiovideo' && !hasVideo) {
      setError(LIVE_COPY.recordingVideoMissing);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const podcast = await createPodcastFromLive({
        title: title.trim(),
        description: description.trim() || undefined,
        categoryId,
        format,
        recording,
      });
      void navigate(`/podcasts/${podcast.id}`, {
        state: { notice: VOD_COPY.livePublishedNotice },
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="campus-panel space-y-5 p-6">
      <div>
        <h2 className="text-lg font-bold text-campus-foreground">Guardar como episódio</h2>
        <p className="mt-1 text-sm text-campus-accent">
          A transmissão terminou ({durationLabel}). Escolhe o formato e publica na biblioteca.
        </p>
      </div>

      {error && <Alert title={ERROR_TITLES.livePublishRecording} message={error} />}

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-campus-foreground">Formato do episódio</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={`cursor-pointer border p-4 transition-colors ${
              format === 'audio'
                ? 'border-campus-primary bg-campus-primary/10'
                : 'border-campus-border hover:border-campus-primary/50'
            } ${!hasAudio ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <input
              type="radio"
              name="episodeFormat"
              value="audio"
              className="sr-only"
              checked={format === 'audio'}
              disabled={!hasAudio}
              onChange={() => setFormat('audio')}
            />
            <span className="block font-bold text-campus-foreground">Apenas áudio</span>
            <span className="mt-1 block text-xs text-campus-muted">
              Podcast de áudio{hasAudio ? ` · ${formatBlobSize(audioSize)}` : ' · indisponível'}
            </span>
          </label>

          <label
            className={`cursor-pointer border p-4 transition-colors ${
              format === 'audiovideo'
                ? 'border-campus-primary bg-campus-primary/10'
                : 'border-campus-border hover:border-campus-primary/50'
            } ${!hasVideo ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <input
              type="radio"
              name="episodeFormat"
              value="audiovideo"
              className="sr-only"
              checked={format === 'audiovideo'}
              disabled={!hasVideo}
              onChange={() => setFormat('audiovideo')}
            />
            <span className="block font-bold text-campus-foreground">Áudio + vídeo</span>
            <span className="mt-1 block text-xs text-campus-muted">
              Vídeo com áudio integrado
              {hasVideo ? ` · ${formatBlobSize(videoSize)}` : ' · requer transmissão com câmara'}
            </span>
          </label>
        </div>
      </div>

      <Field
        label="Título do episódio"
        name="episodeTitle"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <TextAreaField
        label="Descrição (opcional)"
        name="episodeDescription"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Resumo do que foi transmitido…"
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="episodeCategory" className="text-sm font-medium text-campus-foreground">
          Categoria
        </label>
        <select
          id="episodeCategory"
          className="w-full rounded-none border border-campus-border bg-campus-surface-elevated px-4 py-3 text-sm text-campus-foreground outline-none focus:border-campus-primary focus:ring-2 focus:ring-campus-primary/30"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={categoriesLoading}
        >
          {categoriesLoading && <option value="">A carregar…</option>}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving || !title.trim()}>
          {isSaving ? 'A publicar…' : 'Publicar episódio'}
        </Button>
        <Button type="button" variant="outline" onClick={onDiscard} disabled={isSaving}>
          Descartar gravação
        </Button>
        <Link to="/live">
          <Button type="button" variant="ghost" disabled={isSaving}>
            Voltar ao hub
          </Button>
        </Link>
      </div>
    </form>
  );
};
