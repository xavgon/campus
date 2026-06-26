import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PodcastCover } from '@/features/podcasts/components/PodcastCover';
import { fetchPublicPodcastById } from '@/features/podcasts/services/podcast.service';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { formatDuration } from '@/features/podcasts/utils/formatDuration';
import { formatPodcastDate } from '@/features/podcasts/utils/formatPodcastDate';
import { Alert } from '@/shared/components/campus/Alert';
import { Button } from '@/shared/components/ui/Button';
import {
  CATALOG_COPY,
  ERROR_TITLES,
  SEARCH_COPY,
} from '@/shared/copy/campusMessages';
import { getApiErrorMessage } from '@/shared/api/client';

export const PublicExploreDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const item = await fetchPublicPodcastById(id);
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

  if (!id) {
    return (
      <Alert title={ERROR_TITLES.podcastInvalid} message={CATALOG_COPY.detailNotFound} />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse bg-campus-border/40" />
        <div className="campus-panel aspect-video max-w-3xl animate-pulse bg-campus-border/30" />
        <div className="campus-panel h-48 max-w-3xl animate-pulse bg-campus-border/20" />
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="space-y-6">
        <Alert
          title={ERROR_TITLES.podcastNotFound}
          message={error ?? CATALOG_COPY.detailNotFound}
        />
        <Link to="/explorar">
          <Button variant="outline">{CATALOG_COPY.detailBack}</Button>
        </Link>
      </div>
    );
  }

  const detailPath = `/podcasts/${podcast.id}`;
  const ctaPath = isAuthenticated
    ? detailPath
    : `/login?redirect=${encodeURIComponent(detailPath)}`;

  return (
    <div className="campus-page-enter w-full max-w-4xl space-y-8">
      <Link
        to="/explorar"
        className="inline-block text-sm font-bold text-campus-primary hover:underline"
      >
        {CATALOG_COPY.detailBack}
      </Link>

      <header className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-campus-primary">
          {CATALOG_COPY.detailEyebrow}
        </p>
        <p className="text-sm text-campus-muted">
          {podcast.categoryName} · {podcast.authorName}
        </p>
        <h1 className="text-3xl font-bold text-campus-foreground sm:text-4xl">{podcast.title}</h1>
        <p className="text-sm text-campus-muted">
          Publicado em {formatPodcastDate(podcast.createdAt)}
          {podcast.durationSeconds > 0 ? ` · ${formatDuration(podcast.durationSeconds)}` : ''}
        </p>
      </header>

      <div className="campus-panel overflow-hidden">
        <div className="relative aspect-video bg-black/60">
          <PodcastCover podcast={podcast} />
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-campus-accent">{podcast.description}</p>
          <p className="text-sm text-campus-muted">{CATALOG_COPY.detailLoginHint}</p>
          <Link to={ctaPath}>
            <Button>
              {isAuthenticated ? SEARCH_COPY.viewEpisode : SEARCH_COPY.loginToListen}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
