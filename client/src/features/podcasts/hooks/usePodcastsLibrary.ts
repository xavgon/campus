import { useEffect, useMemo, useState } from 'react';
import { fetchPodcasts } from '@/features/podcasts/services/podcast.service';
import type { Podcast, PodcastLibraryFilters, PodcastSort } from '@/features/podcasts/types/podcast';
import { computePodcastStats } from '@/features/podcasts/utils/computePodcastStats';
import { filterAndSortPodcasts } from '@/features/podcasts/utils/filterPodcasts';
import { SERVER_URL } from '@/shared/api/client';

const mapApiPodcast = (p: ApiPodcast): Podcast => {
  const isVideo = p.audio_url?.includes('/uploads/video/');
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? '',
    categoryId: String(p.category_id ?? ''),
    categoryName: p.category_name ?? 'Sem categoria',
    coverUrl: p.cover_url ? `${SERVER_URL}${p.cover_url}` : undefined,
    mediaUrl: p.audio_url ? `${SERVER_URL}${p.audio_url}` : undefined,
    mediaType: isVideo ? 'video' : 'audio',
    durationSeconds: 0,
    status: p.compressed_size ? 'published' : 'processing',
    createdAt: p.created_at,
  };
};

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
