import { useEffect, useRef, useState, type FormEvent } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/features/auth/components/icons';
import { uploadAvatar } from '@/features/auth/services/auth.service';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { ProfileSection } from '@/features/profile/components/ProfileSection';
import { formatMemberSince } from '@/features/profile/utils/formatMemberSince';
import {
  hasFieldErrors,
  validateChangePassword,
  validateProfileName,
  type ChangePasswordErrors,
  type ProfileNameErrors,
} from '@/features/profile/utils/profile.validation';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { Field } from '@/shared/components/campus/Field';
import { Button } from '@/shared/components/ui/Button';

export const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [nameErrors, setNameErrors] = useState<ProfileNameErrors>({});
  const [nameNotice, setNameNotice] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<ChangePasswordErrors>({});
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  useEffect(() => {
    if (user?.nome) setNome(user.nome);
  }, [user?.nome]);

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-campus-muted">
        A carregar perfil…
      </div>
    );
  }

  const memberSince = formatMemberSince(user.created_at);
  const nomeChanged = nome.trim() !== user.nome;

  const onNameSubmit = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateProfileName(nome);
    setNameErrors(errors);
    setNameNotice(null);

    if (hasFieldErrors(errors)) return;

    if (!nomeChanged) {
      setNameNotice('Não há alterações para guardar.');
      return;
    }

    setNameNotice(
      'A gravação do nome será activada com a API de perfil (Módulo 6). Os dados foram validados localmente.',
    );
  };

  const onAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setAvatarLoading(true);
    try {
      const result = await uploadAvatar(file);
      updateUser({ foto_perfil: result.data.user.foto_perfil });
    } catch {
      setAvatarError('Erro ao actualizar a foto. Tenta novamente.');
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onPasswordSubmit = (event: FormEvent) => {
    event.preventDefault();
    const errors = validateChangePassword(currentPassword, newPassword, confirmPassword);
    setPasswordErrors(errors);
    setPasswordNotice(null);

    if (hasFieldErrors(errors)) return;

    setPasswordNotice(
      'A alteração de password será activada com a API de perfil (Módulo 6). Os campos estão prontos.',
    );
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="campus-page-enter space-y-8">
      <PageHeader
        eyebrow="Conta"
        title="Perfil"
        description="Gere a tua identidade na plataforma, dados de acesso e sessão."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-8">
        <aside className="campus-panel flex flex-col items-center p-6 text-center sm:p-8 lg:items-stretch lg:text-left">
          <div className="mx-auto lg:mx-0">
            <ProfileAvatar nome={user.nome} fotoUrl={user.foto_perfil} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-campus-foreground">{user.nome}</h2>
          <p className="mt-1 break-all text-sm text-campus-accent">{user.email}</p>
          <dl className="mt-6 w-full space-y-3 border-t border-campus-border/60 pt-5 text-left text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-campus-muted">Membro desde</dt>
              <dd className="text-right font-medium text-campus-foreground">{memberSince}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-campus-muted">ID</dt>
              <dd className="truncate font-mono text-xs text-campus-accent" title={user.id}>
                {user.id.slice(0, 8)}…
              </dd>
            </div>
          </dl>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onAvatarChange}
          />
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="mt-6"
            disabled={avatarLoading}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarLoading ? 'A enviar…' : 'Alterar foto'}
          </Button>
          {avatarError && <p className="mt-2 text-xs text-campus-danger">{avatarError}</p>}
          <p className="mt-2 text-xs text-campus-muted">JPG, PNG ou WebP · máx. 5 MB</p>
        </aside>

        <div className="space-y-6">
          <ProfileSection
            title="Dados pessoais"
            description="O teu nome aparece no dashboard e nos episódios que publicares."
          >
            <form className="space-y-5" onSubmit={onNameSubmit} noValidate>
              {nameNotice && (
                <ProfileNotice
                  title="Informação"
                  message={nameNotice}
                  variant={nameNotice.includes('validados') ? 'success' : 'info'}
                />
              )}
              <Field
                label="Nome completo"
                name="nome"
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  if (nameErrors.nome) setNameErrors({});
                }}
                error={nameErrors.nome}
                autoComplete="name"
              />
              <Field
                label="Email"
                name="email"
                value={user.email}
                readOnly
                hint="O email não pode ser alterado nesta fase do projeto."
                icon={<MailIcon />}
                className="cursor-not-allowed opacity-80"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setNome(user.nome);
                    setNameErrors({});
                    setNameNotice(null);
                  }}
                  disabled={!nomeChanged}
                >
                  Repor
                </Button>
                <Button type="submit" disabled={!nomeChanged}>
                  Guardar alterações
                </Button>
              </div>
            </form>
          </ProfileSection>

          <ProfileSection
            title="Segurança"
            description="Mantém a tua conta protegida com uma password forte."
          >
            <form className="space-y-5" onSubmit={onPasswordSubmit} noValidate>
              {passwordNotice && (
                <ProfileNotice title="Informação" message={passwordNotice} variant="success" />
              )}
              <Field
                label="Password atual"
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
                icon={<LockIcon />}
                iconRight={
                  <button
                    type="button"
                    className="text-campus-muted transition hover:text-campus-primary"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? 'Ocultar password' : 'Mostrar password'}
                  >
                    {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Nova password"
                  name="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={passwordErrors.newPassword}
                  hint="Mínimo de 6 caracteres"
                  autoComplete="new-password"
                  icon={<LockIcon />}
                  iconRight={
                    <button
                      type="button"
                      className="text-campus-muted transition hover:text-campus-primary"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? 'Ocultar password' : 'Mostrar password'}
                    >
                      {showNew ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  }
                />
                <Field
                  label="Confirmar nova password"
                  name="confirmPassword"
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={passwordErrors.confirmPassword}
                  autoComplete="new-password"
                  icon={<LockIcon />}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="secondary">
                  Atualizar password
                </Button>
              </div>
            </form>
          </ProfileSection>

          <ProfileSection
            title="Sessão"
            description="Termina a sessão neste dispositivo. Terás de voltar a entrar."
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-campus-accent">
                Estás autenticado como <span className="font-semibold text-campus-foreground">{user.email}</span>.
              </p>
              <Button type="button" variant="outline" onClick={logout} className="border-campus-danger/40 text-campus-danger hover:border-campus-danger hover:bg-campus-danger/10">
                Terminar sessão
              </Button>
            </div>
          </ProfileSection>
        </div>
      </div>
    </div>
  );
};
