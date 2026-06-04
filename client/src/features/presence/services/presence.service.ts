import { api } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';
import type { OnlineSnapshot } from '@/features/presence/types/presence.types';

export const sendPresenceHeartbeat = async (): Promise<void> => {
  await api.post<ApiResponse<{ ok: boolean }>>('/presence/heartbeat');
};

export const sendPresenceLeave = async (): Promise<void> => {
  await api.post<ApiResponse<{ ok: boolean }>>('/presence/leave');
};

export const fetchOnlineSnapshot = async (): Promise<OnlineSnapshot> => {
  const { data } = await api.get<ApiResponse<OnlineSnapshot>>('/presence/online');
  return data.data;
};
