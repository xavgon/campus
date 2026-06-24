import { useCallback, useEffect, useState } from 'react';
import { fetchScheduledStreams } from '@/features/live/services/live.service';
import type { ScheduledStream } from '@/features/live/types/live.types';
import { getApiErrorMessage } from '@/shared/api/client';

export const useScheduledStreams = (enabled = true) => {
  const [streams, setStreams] = useState<ScheduledStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const items = await fetchScheduledStreams();
      setStreams(items);
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

  return { streams, isLoading, error, refresh };
};
