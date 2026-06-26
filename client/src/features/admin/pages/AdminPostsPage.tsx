import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminDataTable } from '@/features/admin/components/AdminDataTable';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { adminSelectClass } from '@/features/admin/components/adminFormStyles';
import { useAdminLookups } from '@/features/admin/hooks/useAdminLookups';
import {
  deleteAdminPodcast,
  fetchAdminPodcasts,
  updateAdminPodcast,
} from '@/features/admin/services/admin.service';
import type { AdminPodcastRow } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { truncateFingerprint } from '@/features/podcasts/utils/truncateFingerprint';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { Field } from '@/shared/components/campus/Field';
import { Modal } from '@/shared/components/campus/Modal';
import { TextAreaField } from '@/shared/components/campus/TextAreaField';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

export const AdminPostsPage = () => {
  const { categories } = useAdminLookups();
  const [posts, setPosts] = useState<AdminPodcastRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editing, setEditing] = useState<AdminPodcastRow | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      setPosts(await fetchAdminPodcasts());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (post: AdminPodcastRow) => {
    setEditing(post);
    setEditTitle(post.title);
    setEditDescription(post.description ?? '');
    setEditCategoryId(post.category_id != null ? String(post.category_id) : '');
  };

  const onEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusyId(editing.id);
    setNotice(null);
    try {
      const updated = await updateAdminPodcast(editing.id, {
        title: editTitle,
        description: editDescription,
        category_id: editCategoryId ? Number(editCategoryId) : null,
      });
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setNotice('Publicação actualizada.');
      setEditing(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (post: AdminPodcastRow) => {
    if (!window.confirm(`Remover «${post.title}»?`)) return;
    setBusyId(post.id);
    setNotice(null);
    try {
      await deleteAdminPodcast(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      setNotice('Publicação removida.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="campus-panel p-5 sm:p-7">
      <AdminPageHeader
        eyebrow="Publicações"
        title="Moderação de podcasts"
        description="Task 9 — o administrador modera (editar/remover) mas não publica. A criação de episódios é exclusiva do papel criador."
      />

      <AdminFeedback notice={notice} error={error} />

      <ProfileNotice
        title="Separação de papéis"
        message="Publicar novos episódios com áudio requer conta criador (/podcasts/new). Aqui podes corrigir metadados ou remover conteúdo indevido."
        variant="info"
        className="mb-6"
      />

      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-campus-muted">
        Publicações na plataforma
      </h2>

      <AdminDataTable
        rows={posts}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhuma publicação na plataforma."
        columns={[
          {
            key: 'title',
            header: 'Título',
            render: (row) => (
              <div className="max-w-xs">
                <p className="font-semibold text-campus-foreground">{row.title}</p>
                {row.category_name && (
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-campus-primary">
                    {row.category_name}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'author',
            header: 'Autor',
            render: (row) => (
              <div>
                <p className="text-campus-foreground">{row.author_nome}</p>
                <p className="text-xs text-campus-muted">{row.author_email}</p>
              </div>
            ),
          },
          {
            key: 'authorship',
            header: 'Autoria',
            render: (row) =>
              row.author_cert_fingerprint ? (
                <div>
                  <p className="text-xs font-semibold text-emerald-300">Certificada</p>
                  <p className="text-[11px] text-campus-muted">{row.author_cert_cn ?? '—'}</p>
                  <p className="font-mono text-[10px] text-campus-muted">
                    {truncateFingerprint(row.author_cert_fingerprint)}
                  </p>
                </div>
              ) : (
                <span className="text-xs text-campus-muted">Sem certificado</span>
              ),
          },
          {
            key: 'created',
            header: 'Data',
            render: (row) => (
              <span className="text-xs text-campus-muted">{formatAdminDate(row.created_at)}</span>
            ),
          },
          {
            key: 'actions',
            header: 'Acções',
            className: 'text-right',
            render: (row) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="px-2! py-1.5! text-xs"
                  disabled={busyId === row.id}
                  onClick={() => openEdit(row)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2! py-1.5! text-xs text-campus-danger hover:bg-campus-danger/10"
                  disabled={busyId === row.id}
                  onClick={() => void onDelete(row)}
                >
                  Remover
                </Button>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar publicação"
        description={editing?.author_nome}
      >
        <form className="space-y-4" onSubmit={onEditSubmit}>
          <Field
            label="Título"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />
          <TextAreaField
            label="Descrição"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-campus-foreground">Categoria</label>
            <select
              className={adminSelectClass}
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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
