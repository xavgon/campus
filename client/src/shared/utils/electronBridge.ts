import type { CampusDesktopApi } from '@/shared/types/electron';

export const getCampusDesktop = (): CampusDesktopApi | null =>
  typeof window !== 'undefined' && window.campusDesktop ? window.campusDesktop : null;
