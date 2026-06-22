import type { DashboardShortcutIcon as IconId } from '@/features/dashboard/constants';

interface DashboardShortcutIconProps {
  icon: IconId;
}

const iconClass = 'h-6 w-6';

export const DashboardShortcutIcon = ({ icon }: DashboardShortcutIconProps) => {
  switch (icon) {
    case 'publish':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path strokeLinecap="square" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
        </svg>
      );
    case 'live':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          <path strokeLinecap="round" d="M4.5 9.5a8 8 0 0115 0M2 12a12 12 0 0120 0" />
        </svg>
      );
    case 'explore':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="square" d="M20 20l-3.5-3.5" />
        </svg>
      );
    case 'profile':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="8" r="4" />
          <path strokeLinecap="square" d="M5 20c0-4 3.5-6 7-6s7 2 7 6" />
        </svg>
      );
    case 'podcasts':
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path
            strokeLinecap="square"
            d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-2c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"
          />
        </svg>
      );
  }
};
