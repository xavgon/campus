import { useCallback, useEffect, useState } from 'react';
import { AdminDataTable } from '@/features/admin/components/AdminDataTable';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { fetchAdminLogs } from '@/features/admin/services/admin.service';
import type { AdminLogRow } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

export const AdminLogsPage = () => {
  const [logs, setLogs] = useState<AdminLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLogs(await fetchAdminLogs());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="campus-panel p-5 sm:p-7">
      <AdminPageHeader
        eyebrow="Registo"
        title="Actividade administrativa"
        description="Histórico das acções feitas neste painel (criar, editar, eliminar). Atualiza após cada operação."
      />

      <div className="mb-4 flex justify-end">
        <Button type="button" variant="outline" className="!py-2 text-xs" onClick={() => void load()}>
          Actualizar
        </Button>
      </div>

      <AdminFeedback error={error} />

      <AdminDataTable
        rows={logs}
        getRowKey={(row) => String(row.id)}
        emptyMessage="Ainda não há entradas. As acções no painel admin passam a aparecer aqui."
        columns={[
          {
            key: 'when',
            header: 'Data',
            render: (row) => (
              <span className="whitespace-nowrap text-xs text-campus-muted">
                {formatAdminDate(row.created_at)}
              </span>
            ),
          },
          {
            key: 'who',
            header: 'Administrador',
            render: (row) => (
              <span className="text-campus-foreground">{row.user_nome ?? 'Sistema'}</span>
            ),
          },
          {
            key: 'action',
            header: 'Acção',
            render: (row) => <span className="text-campus-accent">{row.action}</span>,
          },
        ]}
      />
    </section>
  );
};
