import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PodcastCover } from '@/features/podcasts/components/PodcastCover';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { formatDuration } from '@/features/podcasts/utils/formatDuration';
import { formatPodcastDate } from '@/features/podcasts/utils/formatPodcastDate';
import { SEARCH_COPY } from '@/shared/copy/campusMessages';
import { Button } from '@/shared/components/ui/Button';

interface PublicPodcastCardProps {
  podcast: Podcast;
}

export const PublicPodcastCard = ({ podcast }: PublicPodcastCardProps) => {
  const { isAuthenticated } = useAuth();
  const detailPath = `/explorar/${podcast.id}`;
  const listenPath = isAuthenticated
    ? `/podcasts/${podcast.id}`
    : `/login?redirect=${encodeURIComponent(`/podcasts/${podcast.id}`)}`;
  const ctaLabel = isAuthenticated ? SEARCH_COPY.viewEpisode : SEARCH_COPY.loginToListen;

  return (
    <article className="campus-panel group flex flex-col overflow-hidden transition hover:border-campus-primary/35">
      <Link
        to={detailPath}
        className="relative block aspect-[16/10] overflow-hidden border-b border-campus-border/60 bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-campus-primary"
      >
        <PodcastCover podcast={podcast} />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />
        {podcast.durationSeconds > 0 && (
          <span className="absolute bottom-2 right-2 rounded-none border border-white/10 bg-black/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-campus-foreground backdrop-blur-sm">
            {formatDuration(podcast.durationSeconds)}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-campus-primary">
          {podcast.categoryName}
        </p>
        <p className="mt-1 text-xs text-campus-muted">{podcast.authorName}</p>
        <Link
          to={detailPath}
          className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-campus-foreground transition hover:text-campus-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary"
        >
          {podcast.title}
        </Link>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-campus-accent">
          {podcast.description}
        </p>

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-campus-border/50 pt-3">
          <span className="text-xs text-campus-muted">{formatPodcastDate(podcast.createdAt)}</span>
          <Link to={listenPath} className="shrink-0">
            <Button variant="outline" className="!py-2 text-xs">
              {ctaLabel}
            </Button>
          </Link>
        </footer>
      </div>
    </article>
  );
};
