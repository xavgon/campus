import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AdminDataTable } from '@/features/admin/components/AdminDataTable';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminFormPanel } from '@/features/admin/components/AdminFormPanel';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { adminSelectClass } from '@/features/admin/components/adminFormStyles';
import { useAdminLookups } from '@/features/admin/hooks/useAdminLookups';
import {
  createAdminStream,
  deleteAdminStream,
  fetchAdminStreams,
  updateAdminStream,
} from '@/features/admin/services/admin.service';
import type { AdminStreamRow, StreamStatus } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { streamStatusLabel } from '@/features/admin/utils/streamStatusLabel';
import { Field } from '@/shared/components/campus/Field';
import { Modal } from '@/shared/components/campus/Modal';
import { TextAreaField } from '@/shared/components/campus/TextAreaField';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

const STATUS_OPTIONS: StreamStatus[] = ['scheduled', 'live', 'ended'];

export const AdminTransmissionsPage = () => {
  const { users } = useAdminLookups();
  const [streams, setStreams] = useState<AdminStreamRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<StreamStatus>('scheduled');
  const [hostId, setHostId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const [editing, setEditing] = useState<AdminStreamRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<StreamStatus>('scheduled');
  const [editHostId, setEditHostId] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      setStreams(await fetchAdminStreams());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const toLocalInput = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setIsCreating(true);
    setNotice(null);
    setError(null);
    try {
      const created = await createAdminStream({
        title,
        description,
        status,
        host_user_id: hostId || null,
        scheduled_at: fromLocalInput(scheduledAt),
      });
      setStreams((prev) => [created, ...prev]);
      setNotice('Transmissão criada.');
      setTitle('');
      setDescription('');
      setStatus('scheduled');
      setHostId('');
      setScheduledAt('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (stream: AdminStreamRow) => {
    setEditing(stream);
    setEditTitle(stream.title);
    setEditDescription(stream.description ?? '');
    setEditStatus(stream.status);
    setEditHostId(stream.host_user_id ?? '');
    setEditScheduledAt(toLocalInput(stream.scheduled_at));
  };

  const onEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusyId(editing.id);
    setNotice(null);
    try {
      const updated = await updateAdminStream(editing.id, {
        title: editTitle,
        description: editDescription,
        status: editStatus,
        host_user_id: editHostId || null,
        scheduled_at: fromLocalInput(editScheduledAt),
      });
      setStreams((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setNotice('Transmissão actualizada.');
      setEditing(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onQuickStatus = async (stream: AdminStreamRow, next: StreamStatus) => {
    if (stream.status === next) return;
    setBusyId(stream.id);
    setNotice(null);
    try {
      const updated = await updateAdminStream(stream.id, { status: next });
      setStreams((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setNotice(`Estado: ${streamStatusLabel(next)}.`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (stream: AdminStreamRow) => {
    if (!window.confirm(`Eliminar «${stream.title}»?`)) return;
    setBusyId(stream.id);
    setNotice(null);
    try {
      await deleteAdminStream(stream.id);
      setStreams((prev) => prev.filter((s) => s.id !== stream.id));
      setNotice('Transmissão eliminada.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="campus-panel p-5 sm:p-7">
      <AdminPageHeader
        eyebrow="Transmissões"
        title="Gestão de emissões"
        description="Agenda transmissões, define anfitrião e estado (agendada, em direto, terminada). O streaming de vídeo/áudio liga-se num módulo futuro."
      />

      <AdminFeedback notice={notice} error={error} />

      <AdminFormPanel
        title="Nova transmissão"
        description="Cria uma entrada na plataforma para gerir emissões ao vivo ou agendadas."
        submitLabel="Criar transmissão"
        isSubmitting={isCreating}
        onSubmit={onCreate}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Título"
            name="streamTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-campus-foreground">Estado</label>
            <select
              className={adminSelectClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as StreamStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {streamStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <TextAreaField
          label="Descrição"
          name="streamDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-campus-foreground">Anfitrião</label>
            <select
              className={adminSelectClass}
              value={hostId}
              onChange={(e) => setHostId(e.target.value)}
            >
              <option value="">Nenhum</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Data e hora (agendamento)"
            name="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
      </AdminFormPanel>

      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-campus-muted">
        Transmissões registadas
      </h2>

      <AdminDataTable
        rows={streams}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhuma transmissão. Cria uma com o formulário acima."
        columns={[
          {
            key: 'title',
            header: 'Título',
            render: (row) => (
              <span className="font-semibold text-campus-foreground">{row.title}</span>
            ),
          },
          {
            key: 'host',
            header: 'Anfitrião',
            render: (row) => (
              <span className="text-campus-accent">{row.host_nome ?? '—'}</span>
            ),
          },
          {
            key: 'status',
            header: 'Estado',
            render: (row) => (
              <select
                className={adminSelectClass}
                value={row.status}
                disabled={busyId === row.id}
                onChange={(e) => void onQuickStatus(row, e.target.value as StreamStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {streamStatusLabel(s)}
                  </option>
                ))}
              </select>
            ),
          },
          {
            key: 'scheduled',
            header: 'Agendada',
            render: (row) => (
              <span className="text-xs text-campus-muted">
                {row.scheduled_at ? formatAdminDate(row.scheduled_at) : '—'}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Acções',
            className: 'text-right',
            render: (row) => (
              <div className="flex justify-end gap-2">
                {row.status === 'live' && (
                  <Link to={`/live/${row.id}`}>
                    <Button type="button" variant="primary" className="!px-2 !py-1.5 text-xs">
                      Ver ao vivo
                    </Button>
                  </Link>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="!px-2 !py-1.5 text-xs"
                  disabled={busyId === row.id}
                  onClick={() => openEdit(row)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="!px-2 !py-1.5 text-xs text-campus-danger hover:bg-campus-danger/10"
                  disabled={busyId === row.id}
                  onClick={() => void onDelete(row)}
                >
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar transmissão"
      >
        <form className="space-y-4" onSubmit={onEditSubmit}>
          <Field label="Título" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
          <TextAreaField
            label="Descrição"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-campus-foreground">Estado</label>
              <select
                className={adminSelectClass}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as StreamStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {streamStatusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-campus-foreground">Anfitrião</label>
              <select
                className={adminSelectClass}
                value={editHostId}
                onChange={(e) => setEditHostId(e.target.value)}
              >
                <option value="">Nenhum</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Field
            label="Agendamento"
            type="datetime-local"
            value={editScheduledAt}
            onChange={(e) => setEditScheduledAt(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={busyId === editing?.id}>
              Guardar
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
};
