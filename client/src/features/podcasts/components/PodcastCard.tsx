import { Link } from 'react-router-dom';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { PodcastCover } from '@/features/podcasts/components/PodcastCover';
import { PodcastStatusBadge } from '@/features/podcasts/components/PodcastStatusBadge';
import { formatDuration } from '@/features/podcasts/utils/formatDuration';
import { formatPodcastDate } from '@/features/podcasts/utils/formatPodcastDate';

interface PodcastCardProps {
  podcast: Podcast;
}

export const PodcastCard = ({ podcast }: PodcastCardProps) => (
  <Link
    to={`/podcasts/${podcast.id}`}
    className="campus-panel group flex flex-col overflow-hidden transition hover:border-campus-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary"
  >
    <div className="relative aspect-[16/10] overflow-hidden border-b border-campus-border/60 bg-black/40">
      <PodcastCover podcast={podcast} />
      <div className="absolute right-2 top-2">
        <PodcastStatusBadge status={podcast.status} />
      </div>
      {podcast.durationSeconds > 0 && (
        <span className="absolute bottom-2 left-2 rounded-none bg-black/75 px-2 py-0.5 text-[11px] font-semibold text-campus-foreground">
          {formatDuration(podcast.durationSeconds)}
        </span>
      )}
    </div>

    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-campus-primary">
        {podcast.categoryName}
      </p>
      <p className="mt-1 text-xs text-campus-muted">{podcast.authorName}</p>
      <h2 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-campus-foreground group-hover:text-campus-primary">
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

      {podcast.mediaUrl && (
        <div className="border-t border-campus-border/40 bg-black/20 px-4 py-3">
          {podcast.mediaType === 'video' ? (
            <video
              src={podcast.mediaUrl}
              controls
              className="w-full rounded-none"
              style={{ maxHeight: '12rem' }}
              preload="metadata"
            />
          ) : (
            <audio
              src={podcast.mediaUrl}
              controls
              className="w-full"
              preload="metadata"
            />
          )}
        </div>
      )}
    </div>
  </Link>
);
