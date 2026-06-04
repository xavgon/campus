import { Link } from 'react-router-dom';
import type { DashboardShortcut } from '@/features/dashboard/constants';
import { DashboardShortcutIcon } from '@/features/dashboard/components/DashboardShortcutIcon';

interface DashboardShortcutCardProps {
  shortcut: DashboardShortcut;
}

export const DashboardShortcutCard = ({ shortcut }: DashboardShortcutCardProps) => (
  <Link
    to={shortcut.to}
    className={`campus-panel group flex gap-4 p-5 transition sm:p-6 ${
      shortcut.accent
        ? 'border-campus-primary/30 hover:border-campus-primary/60'
        : 'hover:border-campus-primary/40'
    }`}
  >
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-none border ${
        shortcut.accent
          ? 'border-campus-primary/50 bg-campus-primary/15 text-campus-primary'
          : 'border-campus-border/80 bg-black/25 text-campus-muted group-hover:border-campus-primary/40 group-hover:text-campus-primary'
      }`}
      aria-hidden
    >
      <DashboardShortcutIcon icon={shortcut.icon} />
    </div>
    <div className="min-w-0">
      <h2 className="text-base font-bold text-campus-foreground group-hover:text-campus-primary sm:text-lg">
        {shortcut.title}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-campus-accent">{shortcut.description}</p>
    </div>
  </Link>
);
