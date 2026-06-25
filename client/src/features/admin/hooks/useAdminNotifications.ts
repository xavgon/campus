import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminNotifications,
  fetchAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '@/features/admin/services/admin.service';
import type { AdminNotification } from '@/features/admin/types/admin.types';
import { getApiErrorMessage } from '@/shared/api/client';

const POLL_MS = 30_000;

export const useAdminNotifications = (enabled = true) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const [items, count] = await Promise.all([
        fetchAdminNotifications({ limit: 20 }),
        fetchAdminUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    if (!enabled) return undefined;
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  const markRead = useCallback(async (id: number) => {
    await markAdminNotificationRead(id);
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllAdminNotificationsRead();
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at ?? now })));
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markRead,
    markAllRead,
  };
};
