import type { UserRole } from '@/features/auth/types/auth.types';

export interface AdminOverview {
  usersCount: number;
  podcastsCount: number;
  streamsCount: number;
  onlineCount: number;
  liveStreams: number;
}

export interface AdminUserRow {
  id: string;
  nome: string;
  email: string;
  foto_perfil: string | null;
  role: UserRole;
  created_at: string;
}

export interface AdminPodcastRow {
  id: string;
  title: string;
  description: string | null;
  category_id: number | null;
  category_name: string | null;
  user_id: string;
  author_nome: string;
  author_email: string;
  created_at: string;
}

export type StreamStatus = 'scheduled' | 'live' | 'ended';

export interface AdminCategory {
  id: number;
  name: string;
}

export interface AdminLogRow {
  id: number;
  user_id: string | null;
  user_nome: string | null;
  action: string;
  created_at: string;
}

export type AdminNotificationSeverity = 'info' | 'success' | 'warning';

export interface AdminNotification {
  id: number;
  type: string;
  severity: AdminNotificationSeverity;
  title: string;
  message: string;
  actor_user_id: string | null;
  actor_nome: string | null;
  target_href: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AdminStreamRow {
  id: string;
  title: string;
  description: string | null;
  status: StreamStatus;
  host_user_id: string | null;
  host_nome: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  listeners_count?: number;
  ws_connected?: boolean;
  awaiting_reconnect?: boolean;
}
