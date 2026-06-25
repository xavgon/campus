import { useEffect, useMemo, useState } from 'react';
import { fetchPublicPodcasts } from '@/features/podcasts/services/podcast.service';
import type { Podcast, PodcastLibraryFilters } from '@/features/podcasts/types/podcast';
import { filterAndSortPodcasts } from '@/features/podcasts/utils/filterPodcasts';
import { getApiErrorMessage } from '@/shared/api/client';
import { useDebounce } from '@/shared/hooks/useDebounce';

const DEFAULT_FILTERS: PodcastLibraryFilters = {
  search: '',
  categoryId: '',
  sort: 'newest',
};

export const usePodcastsExplore = () => {
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
        const items = await fetchPublicPodcasts({
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

  const setSearch = (search: string) => setFilters((prev) => ({ ...prev, search }));
  const setCategoryId = (categoryId: string) => setFilters((prev) => ({ ...prev, categoryId }));
  const setSort = (sort: PodcastLibraryFilters['sort']) => setFilters((prev) => ({ ...prev, sort }));

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
    setSearch,
    setCategoryId,
    setSort,
    clearFilters,
    hasActiveFilters,
    isEmptyCatalog: !isFetching && !error && podcasts.length === 0 && !hasActiveFilters,
    isEmptyResults: !isFetching && !error && filtered.length === 0 && hasActiveFilters,
  };
};
