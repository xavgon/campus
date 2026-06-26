import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchPublicPodcastCategories,
  fetchPublicPodcasts,
} from '@/features/podcasts/services/podcast.service';
import type { Podcast, PodcastCategory, PodcastLibraryFilters, PodcastSort } from '@/features/podcasts/types/podcast';
import type { PodcastPaginationMeta } from '@/features/podcasts/types/pagination';
import { PODCAST_PAGE_SIZE } from '@/features/podcasts/types/pagination';
import { getApiErrorMessage } from '@/shared/api/client';
import { useDebounce } from '@/shared/hooks/useDebounce';

const parseSort = (value: string | null): PodcastSort => {
  if (value === 'oldest' || value === 'title-asc' || value === 'title-desc') return value;
  return 'newest';
};

const EMPTY_PAGINATION: PodcastPaginationMeta = {
  page: 1,
  limit: PODCAST_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

export const usePublicPodcastsExplore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [pagination, setPagination] = useState<PodcastPaginationMeta>(EMPTY_PAGINATION);
  const [categories, setCategories] = useState<PodcastCategory[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PodcastLibraryFilters>(() => ({
    search: searchParams.get('q') ?? '',
    categoryId: searchParams.get('category') ?? '',
    sort: parseSort(searchParams.get('sort')),
  }));

  const [page, setPage] = useState(() => {
    const raw = Number(searchParams.get('page') ?? '1');
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  });

  const debouncedSearch = useDebounce(filters.search, 300);
  const isSearching = filters.search.trim() !== debouncedSearch.trim();

  useEffect(() => {
    let cancelled = false;
    setCategoriesLoading(true);
    void fetchPublicPodcastCategories()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.categoryId, filters.sort]);

  useEffect(() => {
    let cancelled = false;
    setIsFetching(true);
    setError(null);

    const load = async () => {
      try {
        const result = await fetchPublicPodcasts({
          search: debouncedSearch,
          categoryId: filters.categoryId,
          sort: filters.sort,
          page,
        });
        if (!cancelled) {
          setPodcasts(result.podcasts);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setPodcasts([]);
          setPagination(EMPTY_PAGINATION);
          setError(getApiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, filters.categoryId, filters.sort, page]);

  useEffect(() => {
    const next = new URLSearchParams();
    const q = debouncedSearch.trim();
    if (q) next.set('q', q);
    if (filters.categoryId) next.set('category', filters.categoryId);
    if (filters.sort !== 'newest') next.set('sort', filters.sort);
    if (page > 1) next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, filters.categoryId, filters.sort, page, setSearchParams]);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setCategoryId = useCallback((categoryId: string) => {
    setFilters((prev) => ({ ...prev, categoryId }));
  }, []);

  const setSort = useCallback((sort: PodcastSort) => {
    setFilters((prev) => ({ ...prev, sort }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: '', categoryId: '', sort: 'newest' });
    setPage(1);
  }, []);

  const hasActiveFilters =
    filters.search.trim() !== '' || filters.categoryId !== '' || filters.sort !== 'newest';

  const isLoading = isFetching && podcasts.length === 0;

  return {
    podcasts,
    filtered: podcasts,
    pagination,
    page,
    setPage,
    categories,
    categoriesLoading,
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
    isEmptyCatalog: !isFetching && !error && pagination.total === 0 && !hasActiveFilters,
    isEmptyResults: !isFetching && !error && podcasts.length === 0 && hasActiveFilters,
  };
};
