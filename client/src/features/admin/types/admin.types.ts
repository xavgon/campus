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
  author_cert_fingerprint: string | null;
  author_cert_cn: string | null;
  created_at: string;
}

export interface AdminAllowlistRow {
  ip: string;
  reason: string;
  addedAt: string;
}

export type StreamStatus = 'scheduled' | 'live' | 'ended';

export interface AdminCategory {
  id: number;
  name: string;
}

export interface AdminCertRow {
  id: number;
  cn: string;
  fingerprint: string | null;
  issued_to: string | null;
  issued_at: string;
  expires_at: string | null;
  revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export interface AdminDownloadRow {
  id: number;
  podcast_id: string;
  podcast_title: string | null;
  user_id: string | null;
  user_nome: string | null;
  cert_fingerprint: string | null;
  cert_cn: string | null;
  ip_address: string | null;
  downloaded_at: string;
}

export interface AdminPiracyAlertRow {
  podcast_id: string;
  podcast_title: string | null;
  total_downloads: number;
  unique_certs: number;
  unique_users: number;
  unique_ips: number;
  no_cert_downloads: number;
}

export interface AdminLogRow {
  id: number;
  user_id: string | null;
  user_nome: string | null;
  action: string;
  cert_fingerprint: string | null;
  cert_cn: string | null;
  signature: string | null;
  signature_valid: boolean | null;
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
