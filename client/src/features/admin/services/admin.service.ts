import { api } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import type {
  AdminCategory,
  AdminLogRow,
  AdminNotification,
  AdminOverview,
  AdminPodcastRow,
  AdminStreamRow,
  AdminUserRow,
  StreamStatus,
} from '@/features/admin/types/admin.types';
import type { UserRole } from '@/features/auth/types/auth.types';

export const fetchAdminOverview = async (): Promise<AdminOverview> => {
  const { data } = await api.get<ApiResponse<AdminOverview>>('/admin/overview');
  return data.data;
};

export const fetchAdminCategories = async (): Promise<AdminCategory[]> => {
  const { data } = await api.get<ApiResponse<{ categories: AdminCategory[] }>>('/admin/categories');
  return data.data.categories;
};

export const fetchAdminLogs = async (): Promise<AdminLogRow[]> => {
  const { data } = await api.get<ApiResponse<{ logs: AdminLogRow[] }>>('/admin/logs');
  return data.data.logs;
};

export const fetchAdminNotifications = async (opts?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<AdminNotification[]> => {
  const params: Record<string, string | number> = {};
  if (opts?.limit) params.limit = opts.limit;
  if (opts?.unreadOnly) params.unread = '1';

  const { data } = await api.get<ApiResponse<{ notifications: AdminNotification[] }>>(
    '/admin/notifications',
    { params },
  );
  return data.data.notifications;
};

export const fetchAdminUnreadCount = async (): Promise<number> => {
  const { data } = await api.get<ApiResponse<{ count: number }>>('/admin/notifications/unread-count');
  return data.data.count;
};

export const markAdminNotificationRead = async (id: number): Promise<void> => {
  await api.patch(`/admin/notifications/${id}/read`);
};

export const markAllAdminNotificationsRead = async (): Promise<number> => {
  const { data } = await api.post<ApiResponse<{ count: number }>>('/admin/notifications/read-all');
  return data.data.count;
};

export const fetchAdminUsers = async (): Promise<AdminUserRow[]> => {
  const { data } = await api.get<ApiResponse<{ users: AdminUserRow[] }>>('/admin/users');
  return data.data.users;
};

export const updateAdminUser = async (
  id: string,
  payload: { nome?: string; role?: UserRole },
): Promise<AdminUserRow> => {
  const { data } = await api.patch<ApiResponse<{ user: AdminUserRow }>>(`/admin/users/${id}`, payload);
  return data.data.user;
};

export const deleteAdminUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};

export const fetchAdminPodcasts = async (): Promise<AdminPodcastRow[]> => {
  const { data } = await api.get<ApiResponse<{ podcasts: AdminPodcastRow[] }>>('/admin/podcasts');
  return data.data.podcasts;
};

export const createAdminPodcast = async (payload: {
  title: string;
  description?: string;
  category_id?: number | null;
  user_id: string;
}): Promise<AdminPodcastRow> => {
  const { data } = await api.post<ApiResponse<{ podcast: AdminPodcastRow }>>('/admin/podcasts', payload);
  return data.data.podcast;
};

export const updateAdminPodcast = async (
  id: string,
  payload: { title?: string; description?: string; category_id?: number | null },
): Promise<AdminPodcastRow> => {
  const { data } = await api.patch<ApiResponse<{ podcast: AdminPodcastRow }>>(
    `/admin/podcasts/${id}`,
    payload,
  );
  return data.data.podcast;
};

export const deleteAdminPodcast = async (id: string): Promise<void> => {
  await api.delete(`/admin/podcasts/${id}`);
};

export const fetchAdminStreams = async (): Promise<AdminStreamRow[]> => {
  const { data } = await api.get<ApiResponse<{ streams: AdminStreamRow[] }>>('/admin/streams');
  return data.data.streams;
};

export const createAdminStream = async (payload: {
  title: string;
  description?: string;
  status?: StreamStatus;
  host_user_id?: string | null;
  scheduled_at?: string | null;
}): Promise<AdminStreamRow> => {
  const { data } = await api.post<ApiResponse<{ stream: AdminStreamRow }>>('/admin/streams', payload);
  return data.data.stream;
};

export const updateAdminStream = async (
  id: string,
  payload: {
    title?: string;
    description?: string;
    status?: StreamStatus;
    host_user_id?: string | null;
    scheduled_at?: string | null;
  },
): Promise<AdminStreamRow> => {
  const { data } = await api.patch<ApiResponse<{ stream: AdminStreamRow }>>(
    `/admin/streams/${id}`,
    payload,
  );
  return data.data.stream;
};

export const deleteAdminStream = async (id: string): Promise<void> => {
  await api.delete(`/admin/streams/${id}`);
};
