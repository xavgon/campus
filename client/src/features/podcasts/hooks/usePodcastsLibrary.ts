import { useEffect, useMemo, useState } from 'react';
import { fetchPodcasts } from '@/features/podcasts/services/podcast.service';
import type { Podcast, PodcastLibraryFilters, PodcastSort } from '@/features/podcasts/types/podcast';
import { computePodcastStats } from '@/features/podcasts/utils/computePodcastStats';
import { filterAndSortPodcasts } from '@/features/podcasts/utils/filterPodcasts';
import { getApiErrorMessage } from '@/shared/api/client';
import { useDebounce } from '@/shared/hooks/useDebounce';
const DEFAULT_FILTERS: PodcastLibraryFilters = {
  search: '',
  categoryId: '',
  sort: 'newest',
};

export const usePodcastsLibrary = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PodcastLibraryFilters>(DEFAULT_FILTERS);

  const debouncedSearch = useDebounce(filters.search, 300);
  const isSearching = filters.search.trim() !== debouncedSearch.trim();

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);
    setError(null);

    const load = async () => {
      try {
        const items = await fetchPodcasts({
          search: debouncedSearch,
          categoryId: filters.categoryId,
        });
        if (cancelled) return;
        setPodcasts(items);
      } catch (err) {
        if (cancelled) return;
        setPodcasts([]);
        setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filters.categoryId]);

  const filtered = useMemo(
    () =>
      filterAndSortPodcasts(podcasts, {
        search: '',
        categoryId: '',
        sort: filters.sort,
      }),
    [podcasts, filters.sort],
  );

  const stats = useMemo(() => computePodcastStats(podcasts), [podcasts]);

  const setSearch = (search: string) => setFilters((prev) => ({ ...prev, search }));
  const setCategoryId = (categoryId: string) => setFilters((prev) => ({ ...prev, categoryId }));
  const setSort = (sort: PodcastSort) => setFilters((prev) => ({ ...prev, sort }));

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const hasActiveFilters =
    filters.search.trim() !== '' || filters.categoryId !== '' || filters.sort !== 'newest';

  const isLoading = isFetching && podcasts.length === 0;

  return {
    podcasts,
    filtered,
    isLoading,
    isFetching,
    isSearching,
    error,
    filters,
    stats,
    setSearch,
    setCategoryId,
    setSort,
    clearFilters,
    hasActiveFilters,
    isEmptyLibrary: !isFetching && !error && podcasts.length === 0 && !hasActiveFilters,
    isEmptyResults: !isFetching && !error && filtered.length === 0 && hasActiveFilters,
  };
};
