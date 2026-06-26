import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminDataTable } from '@/features/admin/components/AdminDataTable';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import {
  addAdminAllowlistEntry,
  fetchAdminAllowlist,
  removeAdminAllowlistEntry,
} from '@/features/admin/services/admin.service';
import type { AdminAllowlistRow } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { Field } from '@/shared/components/campus/Field';
import { TextAreaField } from '@/shared/components/campus/TextAreaField';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

const isDevLocalhost = (ip: string) =>
  ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

export const AdminAllowlistPage = () => {
  const [rows, setRows] = useState<AdminAllowlistRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyIp, setBusyIp] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [ip, setIp] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await fetchAdminAllowlist());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onAdd = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedIp = ip.trim();
    const trimmedReason = reason.trim();
    if (!trimmedIp || !trimmedReason) {
      setError('IP e motivo são obrigatórios.');
      return;
    }

    try {
      const entry = await addAdminAllowlistEntry({ ip: trimmedIp, reason: trimmedReason });
      setRows((prev) => {
        const without = prev.filter((row) => row.ip !== entry.ip);
        return [entry, ...without];
      });
      setNotice(`IP ${entry.ip} autorizado sem certificado.`);
      setIp('');
      setReason('');
      setShowForm(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const onRemove = async (row: AdminAllowlistRow) => {
    if (isDevLocalhost(row.ip)) {
      const ok = window.confirm(
        `Remover ${row.ip}? Em desenvolvimento isto pode bloquear o proxy Vite até reiniciar o servidor.`,
      );
      if (!ok) return;
    } else if (!window.confirm(`Remover ${row.ip} da allowlist?`)) {
      return;
    }

    setBusyIp(row.ip);
    setNotice(null);
    setError(null);
    try {
      await removeAdminAllowlistEntry(row.ip);
      setRows((prev) => prev.filter((item) => item.ip !== row.ip));
      setNotice(`IP ${row.ip} removido da lista de excepções.`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyIp(null);
    }
  };

  return (
    <section className="campus-panel p-5 sm:p-7">
      <AdminPageHeader
        eyebrow="Excepções mTLS"
        title="Allowlist de dispositivos"
        description="Autoriza IPs sem certificado de cliente. Em produção a lista começa vazia; em dev, localhost é incluído para o proxy Vite (Task 8)."
      />

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className="py-2! text-xs" onClick={() => void load()}>
          Actualizar
        </Button>
        <Button type="button" className="py-2! text-xs" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Fechar formulário' : 'Adicionar IP'}
        </Button>
      </div>

      <AdminFeedback notice={notice} error={error} />

      {showForm && (
        <div className="mb-6 rounded-none border border-campus-border/70 bg-black/25 p-5 sm:p-6">
          <header className="mb-5 border-b border-campus-border/50 pb-4">
            <h2 className="text-base font-bold text-campus-foreground">Nova excepção</h2>
            <p className="mt-1 text-sm text-campus-accent">
              Usa para salas de aula ou dispositivos onde não é possível instalar o certificado.
            </p>
          </header>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onAdd}>
            <Field
              label="Endereço IP"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="Ex.: 10.0.0.25"
              required
            />
            <div className="sm:col-span-2">
              <TextAreaField
                label="Motivo"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: Sala 3 — portáteis partilhados sem cert instalado"
                rows={3}
                required
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit">Adicionar à allowlist</Button>
            </div>
          </form>
        </div>
      )}

      <AdminDataTable
        rows={rows}
        getRowKey={(row) => row.ip}
        emptyMessage="Nenhuma excepção registada. Adiciona um IP para permitir acesso sem certificado."
        columns={[
          {
            key: 'ip',
            header: 'IP',
            render: (row) => (
              <div>
                <p className="font-mono text-sm font-semibold text-campus-foreground">{row.ip}</p>
                {isDevLocalhost(row.ip) && (
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Dev automático
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'reason',
            header: 'Motivo',
            render: (row) => (
              <p className="max-w-md text-sm text-campus-accent">{row.reason}</p>
            ),
          },
          {
            key: 'added',
            header: 'Desde',
            render: (row) => (
              <span className="text-xs text-campus-muted">{formatAdminDate(row.addedAt)}</span>
            ),
          },
          {
            key: 'actions',
            header: 'Acções',
            className: 'text-right',
            render: (row) => (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2! py-1.5! text-xs text-campus-danger hover:bg-campus-danger/10"
                  disabled={busyIp === row.ip}
                  onClick={() => void onRemove(row)}
                >
                  Remover
                </Button>
              </div>
            ),
          },
        ]}
      />
    </section>
  );
};
