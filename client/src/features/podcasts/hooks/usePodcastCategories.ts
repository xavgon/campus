import { useCallback, useEffect, useState } from 'react';
import { fetchPodcastCategories } from '@/features/podcasts/services/podcast.service';
import type { PodcastCategory } from '@/features/podcasts/types/podcast';
import { getApiErrorMessage } from '@/shared/api/client';

export const usePodcastCategories = (enabled = true) => {
  const [categories, setCategories] = useState<PodcastCategory[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const items = await fetchPodcastCategories();
      setCategories(items);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categories, isLoading, error, refresh };
};
