import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminNotifications } from '@/features/admin/hooks/useAdminNotifications';
import type { AdminNotification, AdminNotificationSeverity } from '@/features/admin/types/admin.types';
import { formatNotificationTime } from '@/features/admin/utils/formatNotificationTime';
import { Button } from '@/shared/components/ui/Button';

const severityClass: Record<AdminNotificationSeverity, string> = {
  info: 'border-campus-border/70 bg-black/25',
  success: 'border-campus-primary/40 bg-campus-primary/10',
  warning: 'border-campus-danger/40 bg-campus-danger/10',
};

interface AdminNotificationsBellProps {
  className?: string;
}

export const AdminNotificationsBell = ({ className = '' }: AdminNotificationsBellProps) => {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useAdminNotifications(true);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const handleSelect = async (notification: AdminNotification) => {
    if (!notification.read_at) {
      await markRead(notification.id);
    }
    setOpen(false);
    if (notification.target_href) {
      void navigate(notification.target_href);
    }
  };

  return (
    <div ref={panelRef} className={`relative ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-none border border-campus-border/70 bg-black/30 text-campus-foreground transition hover:border-campus-primary/50 hover:text-campus-primary"
        aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} por ler` : ''}`}
        aria-expanded={open}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            strokeLinecap="square"
            d="M15 17H9l-1 2h8l-1-2zM12 3a5 5 0 00-5 5v3.5l-1.5 2.5h13L17 11.5V8a5 5 0 00-5-5z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-none border border-black/40 bg-campus-primary px-1 text-[10px] font-bold text-campus-on-primary">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] border border-campus-border/80 bg-campus-surface-elevated shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-campus-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-campus-foreground">Notificações</p>
              <p className="text-[11px] text-campus-muted">Eventos importantes da plataforma</p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-campus-primary hover:underline"
                onClick={() => void markAllRead()}
              >
                Marcar todas lidas
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-campus-muted">
                Sem notificações por agora.
              </p>
            ) : (
              <ul className="divide-y divide-campus-border/50">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left transition hover:bg-black/25 ${
                        notification.read_at ? 'opacity-75' : ''
                      }`}
                      onClick={() => void handleSelect(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 h-2.5 w-2.5 shrink-0 border ${severityClass[notification.severity]}`}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-campus-foreground">
                              {notification.title}
                            </p>
                            <span className="shrink-0 text-[10px] text-campus-muted">
                              {formatNotificationTime(notification.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-campus-accent">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-campus-border/60 p-3">
            <Link to="/admin/notifications" onClick={() => setOpen(false)}>
              <Button variant="outline" fullWidth className="!py-2 text-xs">
                Ver todas
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
