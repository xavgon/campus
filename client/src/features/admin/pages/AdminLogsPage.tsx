import { useCallback, useEffect, useState } from 'react';
import { AdminDataTable } from '@/features/admin/components/AdminDataTable';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { fetchAdminLogs } from '@/features/admin/services/admin.service';
import type { AdminLogRow } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { truncateCertFingerprint } from '@/features/admin/utils/truncateCertFingerprint';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

const SignatureBadge = ({ valid }: { valid: boolean | null }) => {
  if (valid === true) {
    return (
      <span className="inline-flex items-center rounded-none border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
        Válida
      </span>
    );
  }
  if (valid === false) {
    return (
      <span className="inline-flex items-center rounded-none border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-400">
        Inválida
      </span>
    );
  }
  return <span className="text-xs text-campus-muted">Sem assinatura</span>;
};

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
        eyebrow="Não repúdio"
        title="Auditoria assinada"
        description="Registo de acções com assinatura RSA-SHA256, certificado do dispositivo e verificação de integridade em tempo real (Task 3)."
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
        emptyMessage="Ainda não há entradas. Login, publicações e downloads passam a aparecer aqui com assinatura digital."
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
            header: 'Utilizador',
            render: (row) => (
              <span className="text-campus-foreground">{row.user_nome ?? 'Anónimo'}</span>
            ),
          },
          {
            key: 'action',
            header: 'Acção',
            render: (row) => <span className="text-campus-accent">{row.action}</span>,
          },
          {
            key: 'cert',
            header: 'Certificado',
            render: (row) => (
              <span className="text-xs text-campus-foreground">{row.cert_cn ?? '—'}</span>
            ),
          },
          {
            key: 'fingerprint',
            header: 'Fingerprint',
            render: (row) => (
              <span
                className="font-mono text-[10px] text-campus-muted"
                title={row.cert_fingerprint ?? undefined}
              >
                {truncateCertFingerprint(row.cert_fingerprint)}
              </span>
            ),
          },
          {
            key: 'signature',
            header: 'Assinatura',
            render: (row) => <SignatureBadge valid={row.signature_valid} />,
          },
        ]}
      />
    </section>
  );
};
