import type { ApiToastItem } from '@/shared/context/ApiToastContext';
import type { ApiToastVariant } from '@/shared/api/apiEvents';

interface ApiToastStackProps {
  toasts: ApiToastItem[];
  onDismiss: (id: string) => void;
}

const variantStyles: Record<ApiToastVariant, string> = {
  info: 'border-campus-border bg-campus-surface-elevated text-campus-foreground',
  success: 'border-campus-primary/40 bg-campus-primary/10 text-campus-foreground',
  warning: 'border-amber-500/40 bg-amber-500/10 text-campus-foreground',
  error: 'border-campus-danger/40 bg-campus-danger-soft text-campus-foreground',
};

const titleStyles: Record<ApiToastVariant, string> = {
  info: 'text-campus-foreground',
  success: 'text-campus-primary',
  warning: 'text-amber-400',
  error: 'text-campus-danger',
};

export const ApiToastStack = ({ toasts, onDismiss }: ApiToastStackProps) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto w-full max-w-sm rounded-none border px-4 py-3 text-sm shadow-lg shadow-black/40 ${variantStyles[toast.variant]}`}
          role={toast.variant === 'error' ? 'alert' : 'status'}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`font-semibold ${titleStyles[toast.variant]}`}>{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-xs leading-relaxed text-campus-accent">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-xs font-medium text-campus-muted transition hover:text-campus-foreground"
              aria-label="Fechar notificação"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
