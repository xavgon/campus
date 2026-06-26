import type { ManualAudience } from '@/shared/copy/userManual';
import { MANUAL_AUDIENCE_LABELS } from '@/shared/copy/userManual';

const STYLES: Record<ManualAudience, string> = {
  all: 'border-campus-border/60 text-campus-muted',
  visitor: 'border-campus-border/60 text-campus-accent',
  user: 'border-blue-500/30 text-blue-300',
  creator: 'border-campus-primary/40 text-campus-primary',
  admin: 'border-amber-500/40 text-amber-300',
};

export const ManualAudienceBadge = ({ audience }: { audience: ManualAudience }) => (
  <span
    className={`inline-flex rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STYLES[audience]}`}
  >
    {MANUAL_AUDIENCE_LABELS[audience]}
  </span>
);
