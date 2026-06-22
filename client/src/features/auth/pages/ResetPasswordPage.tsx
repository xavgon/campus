import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthFormSkeleton } from '@/features/auth/components/AuthFormSkeleton';
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton';
import { EyeIcon, EyeOffIcon, LockIcon } from '@/features/auth/components/icons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthForm } from '@/features/auth/hooks/useAuthForm';
import { resetPassword } from '@/features/auth/services/auth.service';
import {
  hasResetPasswordFieldErrors,
  validateResetPasswordFields,
  type ResetPasswordFieldErrors,
} from '@/features/auth/utils/resetPassword.validation';
import { Alert } from '@/shared/components/campus/Alert';
import { AuthPanel } from '@/shared/components/campus/AuthPanel';
import { Field } from '@/shared/components/campus/Field';
import { SuccessNotice } from '@/shared/components/campus/SuccessNotice';
import { Button } from '@/shared/components/ui/Button';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { isAuthenticated, isLoading } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const { error, isSubmitting, handleSubmit, setError } = useAuthForm(async () => {
    await resetPassword(token, newPassword);
    setIsSuccess(true);
  });

  const onFormSubmit = (event: FormEvent) => {
    const errors = validateResetPasswordFields(newPassword, confirmPassword);
    setFieldErrors(errors);

    if (hasResetPasswordFieldErrors(errors)) {
      event.preventDefault();
      setError(null);
      return;
    }

    handleSubmit(event);
  };

  if (isLoading) {
    return <AuthFormSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!token) {
    return (
      <AuthPanel
        title="Link inválido"
        subtitle="Este endereço de recuperação não é válido ou já expirou."
        footerText="Queres tentar de novo?"
        footerHref="/login"
        footerLabel="Voltar ao login"
      >
        <Alert
          title="Token em falta"
          message="Pediste um novo link em «Esqueci a password» ou abre o URL completo enviado para o teu email."
        />
      </AuthPanel>
    );
  }

  if (isSuccess) {
    return (
      <AuthPanel
        title="Password redefinida"
        subtitle="Já podes entrar com a nova password."
        footerText="Pronto para continuar?"
        footerHref="/login"
        footerLabel="Ir para o login"
      >
        <div className="space-y-5">
          <SuccessNotice
            title="Conta actualizada"
            message="A tua password foi alterada com sucesso. Usa as novas credenciais para iniciar sessão."
          />
          <Button fullWidth onClick={() => void navigate('/login')}>
            Entrar agora
          </Button>
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="Nova password"
      subtitle="Escolhe uma password segura com pelo menos 6 caracteres."
      footerText="Lembras-te da password?"
      footerHref="/login"
      footerLabel="Entrar"
    >
      <form onSubmit={onFormSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          name="newPassword"
          type={showPassword ? 'text' : 'password'}
          label="Nova password"
          autoComplete="new-password"
          value={newPassword}
          error={fieldErrors.newPassword}
          hint="Mínimo de 6 caracteres"
          icon={<LockIcon />}
          iconRight={
            <button
              type="button"
              className="text-campus-muted transition hover:text-campus-primary"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          }
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: undefined }));
            setError(null);
          }}
        />

        <Field
          name="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          label="Confirmar nova password"
          autoComplete="new-password"
          value={confirmPassword}
          error={fieldErrors.confirmPassword}
          icon={<LockIcon />}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
            setError(null);
          }}
        />

        {error && <Alert title="Não foi possível redefinir" message={error} />}

        <AuthSubmitButton loading={isSubmitting} loadingLabel="A guardar…">
          Redefinir password
        </AuthSubmitButton>
      </form>
    </AuthPanel>
  );
};
