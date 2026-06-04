interface PodcastsStatsProps {
  total: number;
  published: number;
  processing: number;
  draft: number;
}

const statItems = (
  stats: PodcastsStatsProps,
): { label: string; value: number; accent?: boolean }[] => [
  { label: 'Total', value: stats.total, accent: true },
  { label: 'Publicados', value: stats.published },
  { label: 'A processar', value: stats.processing },
  { label: 'Rascunhos', value: stats.draft },
];

export const PodcastsStats = (stats: PodcastsStatsProps) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {statItems(stats).map((item) => (
      <div
        key={item.label}
        className="campus-panel px-4 py-3 sm:px-5 sm:py-4"
      >
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
