import type { PodcastStats } from '@/features/podcasts/utils/computePodcastStats';

interface DashboardOverviewStatsProps extends PodcastStats {}

export const DashboardOverviewStats = ({
  total,
  published,
  totalPlays,
  processing,
}: DashboardOverviewStatsProps) => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
    {[
      { label: 'Episódios', value: total, accent: true },
      { label: 'Publicados', value: published },
      { label: 'Reproduções', value: totalPlays },
      { label: 'A processar', value: processing },
    ].map((item) => (
      <div key={item.label} className="campus-panel px-4 py-3 sm:px-5 sm:py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-campus-muted">
          {item.label}
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${item.accent ? 'text-campus-primary' : 'text-campus-foreground'}`}
        >
          {item.value}
        </p>
      </div>
    ))}
  </div>
);
