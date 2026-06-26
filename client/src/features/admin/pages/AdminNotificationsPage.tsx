import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from '@/features/admin/services/admin.service';
import type { AdminNotification, AdminNotificationSeverity } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { getApiErrorMessage } from '@/shared/api/client';
import { CampusPagination } from '@/shared/components/campus/CampusPagination';
import { LIST_PAGE_SIZE } from '@/shared/constants/pagination';
import { useClientPagination } from '@/shared/hooks/useClientPagination';
import { Button } from '@/shared/components/ui/Button';

const severityLabel: Record<AdminNotificationSeverity, string> = {
  info: 'Informação',
  success: 'Sucesso',
  warning: 'Atenção',
};

export const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setNotifications(await fetchAdminNotifications({ limit: 100 }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = notifications.filter((item) => !item.read_at).length;
  const {
    items: visibleNotifications,
    page,
    setPage,
    totalPages,
  } = useClientPagination(notifications, LIST_PAGE_SIZE);

  const onMarkAll = async () => {
    try {
      await markAllAdminNotificationsRead();
      setNotice('Todas as notificações foram marcadas como lidas.');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const onMarkOne = async (id: number) => {
    try {
      await markAdminNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item,
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <section className="campus-panel p-5 sm:p-7">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <AdminPageHeader
          eyebrow="Alertas"
          title="Notificações"
          description="Registo dos eventos importantes na plataforma — registos, publicações, lives e segurança."
        />
        {unread > 0 && (
          <Button type="button" variant="outline" className="shrink-0" onClick={() => void onMarkAll()}>
            Marcar todas como lidas ({unread})
          </Button>
        )}
      </div>

      <AdminFeedback notice={notice} error={error} />

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="rounded-none border border-dashed border-campus-border/70 px-4 py-10 text-center text-sm text-campus-muted">
            Ainda não há notificações registadas.
          </p>
        ) : (
          <>
            {visibleNotifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-none border px-4 py-4 sm:px-5 ${
                notification.read_at
                  ? 'border-campus-border/50 bg-black/15 opacity-80'
                  : 'border-campus-primary/35 bg-campus-primary/5'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-campus-foreground">{notification.title}</h2>
                    <span className="rounded-none border border-campus-border/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-campus-muted">
                      {severityLabel[notification.severity]}
                    </span>
                    {!notification.read_at && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-campus-primary">
                        Nova
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-campus-accent">{notification.message}</p>
                  <p className="mt-2 text-xs text-campus-muted">
                    {formatAdminDate(notification.created_at)}
                    {notification.actor_nome ? ` · ${notification.actor_nome}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {notification.target_href && (
                    <Link to={notification.target_href}>
                      <Button type="button" variant="outline" className="!py-2 text-xs">
                        Abrir
                      </Button>
                    </Link>
                  )}
                  {!notification.read_at && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="!py-2 text-xs"
                      onClick={() => void onMarkOne(notification.id)}
                    >
                      Marcar lida
                    </Button>
                  )}
                </div>
              </div>
            </article>
            ))}

            <CampusPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              ariaLabel="Paginação de notificações"
              className="border-t border-campus-border/50 pt-4"
            />
          </>
        )}
      </div>
    </section>
  );
};
