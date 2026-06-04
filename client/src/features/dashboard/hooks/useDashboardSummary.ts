import { useEffect, useMemo, useState } from 'react';
import { DEMO_PODCASTS } from '@/features/podcasts/data/demoPodcasts';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { computePodcastStats } from '@/features/podcasts/utils/computePodcastStats';

const RECENT_LIMIT = 3;

export const useDashboardSummary = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (cancelled) return;
      setPodcasts(DEMO_PODCASTS);
      setIsLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => computePodcastStats(podcasts), [podcasts]);

  const recent = useMemo(
    () =>
      [...podcasts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, RECENT_LIMIT),
    [podcasts],
  );

  const needsAttention = useMemo(
    () =>
      podcasts.filter((p) => p.status === 'processing' || p.status === 'draft').slice(0, 4),
    [podcasts],
  );

  return { stats, recent, needsAttention, isLoading };
};
