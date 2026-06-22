import type { Podcast } from '@/features/podcasts/types/podcast';

const COVER_GRADIENTS = [
  'from-campus-primary/40 via-black/60 to-campus-surface-dark',
  'from-slate-500/30 via-black/70 to-campus-surface-dark',
  'from-amber-600/25 via-black/65 to-campus-surface-dark',
  'from-zinc-400/20 via-black/75 to-campus-surface-dark',
] as const;

const gradientForId = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % COVER_GRADIENTS.length;
  return COVER_GRADIENTS[hash];
};

interface PodcastCoverProps {
  podcast: Podcast;
}

export const PodcastCover = ({ podcast }: PodcastCoverProps) => {
  const gradient = gradientForId(podcast.id);
  const initial = (podcast.categoryName || podcast.title).charAt(0).toUpperCase() || '?';

  if (podcast.coverUrl) {
    return (
      <img
        src={podcast.coverUrl}
        alt=""
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-linear-to-br ${gradient}`}
      aria-hidden
    >
      <span className="text-4xl font-bold text-white/20 sm:text-5xl">{initial}</span>
    </div>
  );
};
