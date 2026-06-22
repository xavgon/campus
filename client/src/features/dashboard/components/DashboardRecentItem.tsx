import { Link } from 'react-router-dom';
import { PodcastStatusBadge } from '@/features/podcasts/components/PodcastStatusBadge';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { formatPodcastDate } from '@/features/podcasts/utils/formatPodcastDate';

interface DashboardRecentItemProps {
  podcast: Podcast;
}

export const DashboardRecentItem = ({ podcast }: DashboardRecentItemProps) => (
  <li className="flex flex-col gap-2 border-b border-campus-border/50 py-4 last:border-0 last:pb-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-campus-primary">
        {podcast.categoryName}
      </p>
      <p className="mt-0.5 truncate font-semibold text-campus-foreground">{podcast.title}</p>
      <p className="mt-0.5 text-xs text-campus-muted">{formatPodcastDate(podcast.createdAt)}</p>
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <PodcastStatusBadge status={podcast.status} />
      <Link
        to={`/podcasts/${podcast.id}`}
        className="text-xs font-bold text-campus-primary hover:underline"
      >
        Ouvir
      </Link>
    </div>
  </li>
);
