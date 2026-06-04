import type { StreamStatus } from '@/features/admin/types/admin.types';

const LABELS: Record<StreamStatus, string> = {
  scheduled: 'Agendada',
  live: 'Em direto',
  ended: 'Terminada',
};

export const streamStatusLabel = (status: StreamStatus): string => LABELS[status];
