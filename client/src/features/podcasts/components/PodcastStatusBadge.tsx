import type { PodcastStatus } from '@/features/podcasts/types/podcast';
import { podcastStatusLabel } from '@/features/podcasts/utils/podcastStatusLabel';

const statusClasses: Record<PodcastStatus, string> = {
  published: 'border-campus-primary/50 bg-campus-primary/15 text-campus-primary',
  processing: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  draft: 'border-campus-border bg-black/30 text-campus-muted',
};

interface PodcastStatusBadgeProps {
  status: PodcastStatus;
}

export const PodcastStatusBadge = ({ status }: PodcastStatusBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClasses[status]} ${status === 'processing' ? 'animate-pulse' : ''}`}
  >
    {podcastStatusLabel(status)}
  </span>
);
