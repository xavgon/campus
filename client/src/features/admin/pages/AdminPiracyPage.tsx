import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '@/features/admin/components/AdminDataTable';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import {
  fetchAdminDownloads,
  fetchAdminPiracyAlerts,
} from '@/features/admin/services/admin.service';
import type { AdminDownloadRow, AdminPiracyAlertRow } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { truncateCertFingerprint } from '@/features/admin/utils/truncateCertFingerprint';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

const alertRisk = (alert: AdminPiracyAlertRow): 'high' | 'medium' | 'low' => {
  if (alert.unique_certs >= 3 || alert.no_cert_downloads > 0) return 'high';
  if (alert.unique_certs >= 2) return 'medium';
  return 'low';
};

const RiskBadge = ({ level }: { level: 'high' | 'medium' | 'low' }) => {
  const styles = {
    high: 'border-red-500/40 bg-red-500/10 text-red-400',
    medium: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    low: 'border-campus-border/60 bg-black/20 text-campus-muted',
  };
  const labels = { high: 'Suspeito', medium: 'Atenção', low: 'Normal' };
  return (
    <span
      className={`inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase ${styles[level]}`}
    >
      {labels[level]}
    </span>
  );
};

export const AdminPiracyPage = () => {
  const [downloads, setDownloads] = useState<AdminDownloadRow[]>([]);
  const [alerts, setAlerts] = useState<AdminPiracyAlertRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [downloadRows, alertRows] = await Promise.all([
        fetchAdminDownloads(),
        fetchAdminPiracyAlerts(),
      ]);
      setDownloads(downloadRows);
      setAlerts(alertRows);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <section className="campus-panel p-5 sm:p-7">
        <AdminPageHeader
          eyebrow="Anti-pirataria"
          title="Alertas de distribuição"
          description="Episódios com múltiplos downloads são analisados por dispositivo (cert fingerprint), utilizador e IP (Task 5)."
        />

        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" className="py-2! text-xs" onClick={() => void load()}>
            Actualizar
          </Button>
          <Link to="/admin/certs">
            <Button type="button" variant="outline" className="py-2! text-xs">
              Gerir certificados
            </Button>
          </Link>
        </div>

        <AdminFeedback error={error} />

        <AdminDataTable
          rows={alerts}
          getRowKey={(row) => row.podcast_id}
          emptyMessage="Sem alertas — aparecem quando um episódio tem mais de um download registado."
          columns={[
            {
              key: 'title',
              header: 'Episódio',
              render: (row) => (
                <span className="font-medium text-campus-foreground">
                  {row.podcast_title ?? row.podcast_id.slice(0, 8)}
                </span>
              ),
            },
            {
              key: 'total',
              header: 'Downloads',
              render: (row) => <span>{row.total_downloads}</span>,
            },
            {
              key: 'certs',
              header: 'Dispositivos',
              render: (row) => <span className="text-campus-accent">{row.unique_certs}</span>,
            },
            {
              key: 'users',
              header: 'Utilizadores',
              render: (row) => <span>{row.unique_users}</span>,
            },
            {
              key: 'no_cert',
              header: 'Sem cert',
              render: (row) => (
                <span className={row.no_cert_downloads > 0 ? 'text-campus-danger' : 'text-campus-muted'}>
                  {row.no_cert_downloads}
                </span>
              ),
            },
            {
              key: 'risk',
              header: 'Risco',
              render: (row) => <RiskBadge level={alertRisk(row)} />,
            },
          ]}
        />
      </section>

      <section className="campus-panel p-5 sm:p-7">
        <AdminPageHeader
          eyebrow="Rastreio"
          title="Histórico de downloads"
          description="Cada download fica ligado ao certificado do dispositivo — permite identificar a origem de fugas."
        />

        <AdminDataTable
          rows={downloads}
          getRowKey={(row) => String(row.id)}
          emptyMessage="Nenhum download registado. Descarrega um episódio na biblioteca para ver o rastreio."
          columns={[
            {
              key: 'when',
              header: 'Data',
              render: (row) => (
                <span className="whitespace-nowrap text-xs text-campus-muted">
                  {formatAdminDate(row.downloaded_at)}
                </span>
              ),
            },
            {
              key: 'podcast',
              header: 'Episódio',
              render: (row) => (
                <span className="text-campus-foreground">{row.podcast_title ?? '—'}</span>
              ),
            },
            {
              key: 'user',
              header: 'Utilizador',
              render: (row) => <span>{row.user_nome ?? '—'}</span>,
            },
            {
              key: 'cert',
              header: 'Certificado',
              render: (row) => <span className="text-xs">{row.cert_cn ?? '—'}</span>,
            },
            {
              key: 'fp',
              header: 'Fingerprint',
              render: (row) => (
                <span
                  className="font-mono text-[10px] text-campus-accent"
                  title={row.cert_fingerprint ?? undefined}
                >
                  {truncateCertFingerprint(row.cert_fingerprint)}
                </span>
              ),
            },
            {
              key: 'ip',
              header: 'IP',
              render: (row) => (
                <span className="font-mono text-[10px] text-campus-muted">{row.ip_address ?? '—'}</span>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
};
