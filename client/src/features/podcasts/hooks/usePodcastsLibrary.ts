import { useEffect, useMemo, useState } from 'react';
import { fetchPodcasts, type ApiPodcast } from '@/features/podcasts/services/podcast.service';
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
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PodcastLibraryFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const data = await fetchPodcasts();
        if (cancelled) return;
        setPodcasts(data.map(mapApiPodcast));
      } catch {
        if (!cancelled) setPodcasts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
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
