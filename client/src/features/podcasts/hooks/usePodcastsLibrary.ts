import { useEffect, useMemo, useState } from 'react';
import { fetchPodcasts } from '@/features/podcasts/services/podcast.service';
import type { Podcast, PodcastLibraryFilters, PodcastSort } from '@/features/podcasts/types/podcast';
import type { PodcastListSummary, PodcastPaginationMeta } from '@/features/podcasts/types/pagination';
import { PODCAST_PAGE_SIZE } from '@/features/podcasts/types/pagination';
import { getApiErrorMessage } from '@/shared/api/client';
import { useDebounce } from '@/shared/hooks/useDebounce';

const DEFAULT_FILTERS: PodcastLibraryFilters = {
  search: '',
  categoryId: '',
  sort: 'newest',
};

const EMPTY_SUMMARY: PodcastListSummary = {
  published: 0,
  processing: 0,
  draft: 0,
};

const EMPTY_PAGINATION: PodcastPaginationMeta = {
  page: 1,
  limit: PODCAST_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export const usePodcastsLibrary = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [pagination, setPagination] = useState<PodcastPaginationMeta>(EMPTY_PAGINATION);
  const [summary, setSummary] = useState<PodcastListSummary>(EMPTY_SUMMARY);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PodcastLibraryFilters>(DEFAULT_FILTERS);

  const debouncedSearch = useDebounce(filters.search, 300);
  const isSearching = filters.search.trim() !== debouncedSearch.trim();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.categoryId, filters.sort]);

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);
    setError(null);

    const load = async () => {
      try {
        const result = await fetchPodcasts({
          search: debouncedSearch,
          categoryId: filters.categoryId,
          sort: filters.sort,
          page,
        });
        if (cancelled) return;
        setPodcasts(result.podcasts);
        setPagination(result.pagination);
        setSummary(result.summary ?? EMPTY_SUMMARY);
      } catch (err) {
        if (cancelled) return;
        setPodcasts([]);
        setPagination(EMPTY_PAGINATION);
        setSummary(EMPTY_SUMMARY);
        setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filters.categoryId, filters.sort, page]);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      published: summary.published,
      processing: summary.processing,
      draft: summary.draft,
    }),
    [pagination.total, summary],
  );

  const setSearch = (search: string) => setFilters((prev) => ({ ...prev, search }));
  const setCategoryId = (categoryId: string) => setFilters((prev) => ({ ...prev, categoryId }));
  const setSort = (sort: PodcastSort) => setFilters((prev) => ({ ...prev, sort }));

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const hasActiveFilters =
    filters.search.trim() !== '' || filters.categoryId !== '' || filters.sort !== 'newest';

  const isLoading = isFetching && podcasts.length === 0;

  return {
    podcasts,
    filtered: podcasts,
    pagination,
    page,
    setPage,
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
    isEmptyLibrary: !isFetching && !error && pagination.total === 0 && !hasActiveFilters,
    isEmptyResults: !isFetching && !error && podcasts.length === 0 && hasActiveFilters,
  };
};
