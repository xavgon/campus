interface UploadProgressBarProps {
  percent: number;
  label?: string;
}

export const UploadProgressBar = ({
  percent,
  label = 'A enviar ficheiros…',
}: UploadProgressBarProps) => {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      className="space-y-2"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="flex justify-between text-xs text-campus-muted">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden bg-campus-border/40">
        <div
          className="h-full bg-campus-primary transition-[width] duration-150 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
