import { useEffect, useMemo, useState } from 'react';
import { DEMO_PODCASTS } from '@/features/podcasts/data/demoPodcasts';
import type { Podcast, PodcastLibraryFilters, PodcastSort } from '@/features/podcasts/types/podcast';
import { computePodcastStats } from '@/features/podcasts/utils/computePodcastStats';
import { filterAndSortPodcasts } from '@/features/podcasts/utils/filterPodcasts';

const DEFAULT_FILTERS: PodcastLibraryFilters = {
  search: '',
  categoryId: '',
  sort: 'newest',
};

export const usePodcastsLibrary = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PodcastLibraryFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (cancelled) return;
      // Substituir por fetchMyPodcasts() quando a API existir (Módulo 2)
      setPodcasts(DEMO_PODCASTS);
      setIsLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => filterAndSortPodcasts(podcasts, filters),
    [podcasts, filters],
  );

  const stats = useMemo(() => computePodcastStats(podcasts), [podcasts]);

  const setSearch = (search: string) => setFilters((prev) => ({ ...prev, search }));
  const setCategoryId = (categoryId: string) => setFilters((prev) => ({ ...prev, categoryId }));
  const setSort = (sort: PodcastSort) => setFilters((prev) => ({ ...prev, sort }));

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.search.trim() !== '' || filters.categoryId !== '' || filters.sort !== 'newest';

  return {
    podcasts,
    filtered,
    isLoading,
    filters,
    stats,
    setSearch,
    setCategoryId,
    setSort,
    clearFilters,
    hasActiveFilters,
    isEmptyLibrary: !isLoading && podcasts.length === 0,
    isEmptyResults: !isLoading && podcasts.length > 0 && filtered.length === 0,
  };
};
