import { Link } from 'react-router-dom';
import { CompressionBadge } from '@/features/podcasts/components/CompressionBadge';
import { PodcastCardMedia } from '@/features/podcasts/components/PodcastCardMedia';
import { PodcastCover } from '@/features/podcasts/components/PodcastCover';
import { PodcastStatusBadge } from '@/features/podcasts/components/PodcastStatusBadge';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { canPlayPodcast, hasPodcastVideo } from '@/features/podcasts/services/podcast.service';
import { getCompressionState } from '@/features/podcasts/utils/compressionState';
import { formatDuration } from '@/features/podcasts/utils/formatDuration';
import { formatPodcastDate } from '@/features/podcasts/utils/formatPodcastDate';

interface PodcastCardProps {
  podcast: Podcast;
}

export const PodcastCard = ({ podcast }: PodcastCardProps) => {
  const withVideo = hasPodcastVideo(podcast);
  const playable = canPlayPodcast(podcast);
  const compressionState = getCompressionState(podcast);

  return (
    <article className="campus-panel group flex flex-col overflow-hidden transition hover:border-campus-primary/35">
      <Link
        to={`/podcasts/${podcast.id}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-campus-primary"
      >
        <div className="relative aspect-[16/10] overflow-hidden border-b border-campus-border/60 bg-black/50">
          <PodcastCover podcast={podcast} />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/20" />

          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            <span className="rounded-none border border-white/15 bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-campus-foreground backdrop-blur-sm">
              {withVideo ? 'Vídeo' : 'Áudio'}
            </span>
            {compressionState !== 'complete' && compressionState !== 'pending' && (
              <CompressionBadge state={compressionState} />
            )}
          </div>

          <div className="absolute right-2 top-2">
            <PodcastStatusBadge status={podcast.status} />
          </div>

          {podcast.durationSeconds > 0 && (
            <span className="absolute bottom-2 right-2 rounded-none border border-white/10 bg-black/70 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-campus-foreground backdrop-blur-sm">
              {formatDuration(podcast.durationSeconds)}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-campus-primary">
            {podcast.categoryName}
          </p>
          <p className="mt-1 text-xs text-campus-muted">{podcast.authorName}</p>
          <h2 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-campus-foreground transition group-hover:text-campus-primary">
            {podcast.title}
          </h2>
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-campus-accent">
            {podcast.description}
          </p>

          <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-campus-border/50 pt-3 text-xs text-campus-muted">
            <span>{formatPodcastDate(podcast.createdAt)}</span>
            {podcast.playCount != null && podcast.status === 'published' && (
              <span>{podcast.playCount} reproduções</span>
            )}
          </footer>
        </div>
      </Link>

      {playable && (
        <div className="border-t border-campus-border/50 bg-black/35 px-3 py-3 sm:px-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-campus-muted">
            Pré-visualização
          </p>
          <PodcastCardMedia podcast={podcast} />
        </div>
      )}
    </article>
  );
};
