import { Link } from 'react-router-dom';
import { PodcastStatusBadge } from '@/features/podcasts/components/PodcastStatusBadge';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { podcastStatusLabel } from '@/features/podcasts/utils/podcastStatusLabel';

interface DashboardAttentionListProps {
  items: Podcast[];
}

export const DashboardAttentionList = ({ items }: DashboardAttentionListProps) => {
  if (items.length === 0) return null;

  return (
    <div className="campus-panel p-5 sm:p-6">
      <header className="mb-4 border-b border-campus-border/60 pb-3">
        <h2 className="text-lg font-bold text-campus-foreground">Requer atenção</h2>
        <p className="mt-1 text-sm text-campus-accent">
          Rascunhos e episódios em processamento.
        </p>
      </header>
      <ul className="space-y-3">
        {items.map((podcast) => (
          <li
            key={podcast.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-none border border-campus-border/60 bg-black/20 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-campus-foreground">
                {podcast.title}
              </p>
              <p className="text-xs text-campus-muted">
                {podcastStatusLabel(podcast.status)} · {podcast.categoryName}
              </p>
            </div>
            <PodcastStatusBadge status={podcast.status} />
          </li>
        ))}
      </ul>
      <Link
        to="/podcasts"
        className="mt-4 inline-block text-sm font-bold text-campus-primary hover:underline"
      >
        Abrir biblioteca →
      </Link>
    </div>
  );
};
