import { useCallback, useEffect, useState } from 'react';
import { fetchOnlineSnapshot } from '@/features/presence/services/presence.service';
import type { OnlineSnapshot } from '@/features/presence/types/presence.types';

const POLL_INTERVAL_MS = 12_000;

export const useOnlineSnapshot = (enabled = true) => {
  const [snapshot, setSnapshot] = useState<OnlineSnapshot>({ count: 0, users: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchOnlineSnapshot();
      setSnapshot(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, refresh]);

  return { snapshot, isLoading, error, refresh };
};
