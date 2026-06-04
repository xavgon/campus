interface AdminStatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}

export const AdminStatCard = ({ label, value, hint, accent }: AdminStatCardProps) => (
  <div className="campus-panel px-4 py-4 sm:px-5 sm:py-5">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-campus-muted">{label}</p>
    <p
      className={`mt-1 text-2xl font-bold tabular-nums ${accent ? 'text-campus-primary' : 'text-campus-foreground'}`}
    >
      {value}
    </p>
    {hint && <p className="mt-1 text-xs text-campus-accent">{hint}</p>}
  </div>
);
