import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminDataTable } from '@/features/admin/components/AdminDataTable';
import { AdminFeedback } from '@/features/admin/components/AdminFeedback';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { adminSelectClass } from '@/features/admin/components/adminFormStyles';
import {
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from '@/features/admin/services/admin.service';
import type { AdminUserRow } from '@/features/admin/types/admin.types';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import type { UserRole } from '@/features/auth/types/auth.types';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { Field } from '@/shared/components/campus/Field';
import { Modal } from '@/shared/components/campus/Modal';
import { getApiErrorMessage } from '@/shared/api/client';
import { Button } from '@/shared/components/ui/Button';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');

  const load = useCallback(async () => {
    setError(null);
    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (user: AdminUserRow) => {
    setEditing(user);
    setEditNome(user.nome);
    setEditRole(user.role);
    setError(null);
  };

  const onRoleChange = async (user: AdminUserRow, role: UserRole) => {
    if (user.role === role) return;
    setBusyId(user.id);
    setNotice(null);
    try {
      const updated = await updateAdminUser(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setNotice(`Papel de ${updated.nome} actualizado.`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusyId(editing.id);
    setNotice(null);
    try {
      const updated = await updateAdminUser(editing.id, {
        nome: editNome,
        role: editRole,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setNotice(`Conta ${updated.email} actualizada.`);
      setEditing(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (user: AdminUserRow) => {
    if (!window.confirm(`Eliminar a conta de ${user.nome}? Esta acção é irreversível.`)) return;
    setBusyId(user.id);
    setNotice(null);
    try {
      await deleteAdminUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setNotice(`Conta ${user.email} eliminada.`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="campus-panel p-5 sm:p-7">
      <AdminPageHeader
        eyebrow="Utilizadores"
        title="Gestão de contas"
        description="Edita nome e papel, altera rapidamente na tabela ou elimina contas (excepto o admin principal)."
      />

      <AdminFeedback notice={notice} error={error} />

      <AdminDataTable
        rows={users}
        getRowKey={(row) => row.id}
        emptyMessage="Nenhum utilizador na base de dados."
        columns={[
          {
            key: 'foto',
            header: 'Foto',
            render: (row) => (
              <ProfileAvatar nome={row.nome} fotoUrl={row.foto_perfil} size="sm" />
            ),
          },
          {
            key: 'nome',
            header: 'Nome',
            render: (row) => (
              <span className="font-semibold text-campus-foreground">{row.nome}</span>
            ),
          },
          {
            key: 'email',
            header: 'Email',
            render: (row) => <span className="text-campus-accent">{row.email}</span>,
          },
          {
            key: 'role',
            header: 'Papel',
            render: (row) => (
              <select
                className={adminSelectClass}
                value={row.role}
                disabled={busyId === row.id}
                onChange={(e) => void onRoleChange(row, e.target.value as UserRole)}
              >
                <option value="user">Utilizador</option>
                <option value="creator">Criador</option>
                <option value="admin">Administrador</option>
              </select>
            ),
          },
          {
            key: 'created',
            header: 'Registo',
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
        title="Editar utilizador"
        description={editing?.email}
      >
        <form className="space-y-4" onSubmit={onEditSubmit}>
          <Field
            label="Nome"
            name="editNome"
            value={editNome}
            onChange={(e) => setEditNome(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="editRole" className="text-sm font-medium text-campus-foreground">
              Papel
            </label>
            <select
              id="editRole"
              className={adminSelectClass}
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
            >
              <option value="user">Utilizador</option>
              <option value="creator">Criador</option>
              <option value="admin">Administrador</option>
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
