import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminDataTable } from '@/features/admin/components/AdminDataTable';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import {
  fetchAdminCerts,
  registerAdminCert,
  revokeAdminCert,
} from '@/features/admin/services/admin.service';
import type { AdminCertRow } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { truncateCertFingerprint } from '@/features/admin/utils/truncateCertFingerprint';
import { Field } from '@/shared/components/campus/Field';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

const CertStatusBadge = ({ revoked }: { revoked: boolean }) =>
  revoked ? (
    <span className="inline-flex border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-400">
      Revogado
    </span>
  ) : (
    <span className="inline-flex border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
      Activo
    </span>
  );

export const AdminCertsPage = () => {
  const [certs, setCerts] = useState<AdminCertRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [cn, setCn] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      setCerts(await fetchAdminCerts());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const cert = await registerAdminCert({
        cn: cn.trim(),
        issued_to: issuedTo.trim(),
        fingerprint: fingerprint.trim() || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      setCerts((prev) => [cert, ...prev]);
      setNotice(`Certificado «${cert.cn}» registado na CA-CAMPUS.`);
      setCn('');
      setIssuedTo('');
      setFingerprint('');
      setExpiresAt('');
      setShowForm(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const onRevoke = async (cert: AdminCertRow) => {
    if (cert.revoked) return;
    const reason = window.prompt(`Motivo da revogação de «${cert.cn}»:`, 'Dispositivo comprometido');
    if (!reason?.trim()) return;

    setBusyId(cert.id);
    setNotice(null);
    setError(null);
    try {
      const updated = await revokeAdminCert(cert.id, reason.trim());
      setCerts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setNotice(`Certificado «${updated.cn}» revogado — acesso bloqueado de imediato.`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="campus-panel p-5 sm:p-7">
      <AdminPageHeader
        eyebrow="CA-CAMPUS"
        title="Certificados emitidos"
        description="Regista e revoga certificados de dispositivo. Emissão via script: node server/scripts/issue-client-cert.mjs &lt;cn&gt; &lt;email&gt; (Task 4)."
      />

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className="py-2! text-xs" onClick={() => void load()}>
          Actualizar
        </Button>
        <Button type="button" className="py-2! text-xs" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Fechar registo' : 'Registar certificado'}
        </Button>
      </div>

      <AdminFeedback notice={notice} error={error} />

      {showForm && (
        <div className="mb-6 rounded-none border border-campus-border/70 bg-black/25 p-5 sm:p-6">
          <header className="mb-5 border-b border-campus-border/50 pb-4">
            <h2 className="text-base font-bold text-campus-foreground">Registar na CA</h2>
            <p className="mt-1 text-sm text-campus-accent">
              Usa após emitir com issue-client-cert.mjs ou para registar fingerprint manualmente.
            </p>
          </header>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onRegister} noValidate>
            <Field label="CN (nome do certificado)" name="cn" value={cn} onChange={(e) => setCn(e.target.value)} required />
            <Field
              label="Emitido para (email)"
              name="issued_to"
              value={issuedTo}
              onChange={(e) => setIssuedTo(e.target.value)}
              required
            />
            <Field
              label="Fingerprint SHA-256 (opcional)"
              name="fingerprint"
              value={fingerprint}
              onChange={(e) => setFingerprint(e.target.value)}
              className="sm:col-span-2"
            />
            <Field
              label="Expira em"
              name="expires_at"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <div className="flex items-end sm:col-span-2">
              <Button type="submit">Registar na CA</Button>
            </div>
          </form>
        </div>
      )}

      <AdminDataTable
        rows={certs}
        getRowKey={(row) => String(row.id)}
        emptyMessage="Nenhum certificado registado. Usa o script issue-client-cert ou regista manualmente."
        columns={[
          {
            key: 'cn',
            header: 'CN',
            render: (row) => <span className="font-medium text-campus-foreground">{row.cn}</span>,
          },
          {
            key: 'issued_to',
            header: 'Destinatário',
            render: (row) => <span className="text-campus-muted">{row.issued_to ?? '—'}</span>,
          },
          {
            key: 'fingerprint',
            header: 'Fingerprint',
            render: (row) => (
              <span className="font-mono text-[10px] text-campus-accent" title={row.fingerprint ?? undefined}>
                {truncateCertFingerprint(row.fingerprint)}
              </span>
            ),
          },
          {
            key: 'issued_at',
            header: 'Emitido',
            render: (row) => (
              <span className="whitespace-nowrap text-xs text-campus-muted">
                {formatAdminDate(row.issued_at)}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            render: (row) => <CertStatusBadge revoked={row.revoked} />,
          },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              row.revoked ? (
                <span className="text-xs text-campus-muted" title={row.revoked_reason ?? undefined}>
                  {row.revoked_reason ? 'Revogado' : '—'}
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="py-1.5! text-xs text-campus-danger"
                  disabled={busyId === row.id}
                  onClick={() => void onRevoke(row)}
                >
                  Revogar
                </Button>
              ),
          },
        ]}
      />
    </section>
  );
};
