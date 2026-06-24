import type { CompressionState } from '@/features/podcasts/utils/compressionState';
import { compressionStateLabel } from '@/features/podcasts/utils/compressionState';

const stateClasses: Record<CompressionState, string> = {
  pending: 'border-campus-border bg-black/30 text-campus-muted',
  processing: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  complete: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
};

interface CompressionBadgeProps {
  state: CompressionState;
}

export const CompressionBadge = ({ state }: CompressionBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stateClasses[state]} ${state === 'processing' ? 'animate-pulse' : ''}`}
  >
    {state === 'processing' && (
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
    )}
    {state === 'complete' && (
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
    )}
    {compressionStateLabel(state)}
  </span>
);
