interface ProfileNoticeProps {
  title: string;
  message: string;
  variant?: 'info' | 'success';
  className?: string;
}

export const ProfileNotice = ({
  title,
  message,
  variant = 'info',
  className = '',
}: ProfileNoticeProps) => (
  <div
    className={`rounded-none border px-4 py-3 text-sm ${
      variant === 'success'
        ? 'border-campus-primary/30 bg-campus-primary/10'
        : 'border-campus-border/80 bg-black/25'
    } ${className}`.trim()}
    role="status"
  >
    <p
      className={`font-semibold ${variant === 'success' ? 'text-campus-primary' : 'text-campus-foreground'}`}
    >
      {title}
    </p>
    <p className="mt-1 text-campus-accent">{message}</p>
  </div>
);
