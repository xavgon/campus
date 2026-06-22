import { useCallback, useEffect, useState } from 'react';
import { LIVE_POLL_INTERVAL_MS } from '@/features/live/constants';
import { fetchActiveLiveSessions } from '@/features/live/services/live.service';
import type { LiveSession } from '@/features/live/types/live.types';
import { getApiErrorMessage } from '@/shared/api/client';

export const useActiveLives = (enabled = true) => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const items = await fetchActiveLiveSessions();
      setSessions(items);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), LIVE_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  return { sessions, isLoading, error, refresh };
};
