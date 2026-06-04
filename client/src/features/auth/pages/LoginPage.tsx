import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthFormSkeleton } from '@/features/auth/components/AuthFormSkeleton';
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/features/auth/components/icons';
import { DEFAULT_ADMIN_LOGIN, REMEMBER_EMAIL_KEY } from '@/features/auth/constants';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAuthForm } from '@/features/auth/hooks/useAuthForm';
import {
  hasLoginFieldErrors,
  validateLoginFields,
  type LoginFieldErrors,
} from '@/features/auth/utils/login.validation';
import { ForgotPasswordModal } from '@/features/auth/components/ForgotPasswordModal';
import { Alert } from '@/shared/components/campus/Alert';
import { AuthPanel } from '@/shared/components/campus/AuthPanel';
import { Field } from '@/shared/components/campus/Field';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
      return;
    }
    if (import.meta.env.DEV) {
      setEmail(DEFAULT_ADMIN_LOGIN.email);
      setPassword(DEFAULT_ADMIN_LOGIN.password);
    }
  }, []);

  const runValidation = (nextEmail = email, nextPassword = password) =>
    validateLoginFields(nextEmail, nextPassword);

  const clearFieldError = (field: keyof LoginFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const { error, isSubmitting, handleSubmit, setError } = useAuthForm(async () => {
    await login({ email: email.trim(), password });
    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
    void navigate('/dashboard');
  });

  const onFormSubmit = (event: FormEvent) => {
    const errors = runValidation();
    setFieldErrors(errors);
    setTouched({ email: true, password: true });

    if (hasLoginFieldErrors(errors)) {
      event.preventDefault();
      setError(null);
      return;
    }

    handleSubmit(event);
  };

  const visibleErrors = {
    email: touched.email ? fieldErrors.email : undefined,
    password: touched.password ? fieldErrors.password : undefined,
  };

  const canSubmit =
    email.trim().length > 0 && password.length > 0 && !hasLoginFieldErrors(runValidation());

  if (isLoading) {
    return <AuthFormSkeleton />;
  }

  return (
    <>
    <ForgotPasswordModal
      open={forgotOpen}
      onClose={() => setForgotOpen(false)}
      initialEmail={email}
    />
    <AuthPanel
      title="Iniciar sessão"
      subtitle="Introduz as tuas credenciais para aceder ao CAMPUS."
      footerText="Ainda não tens conta?"
      footerHref="/register"
      footerLabel="Criar conta grátis"
    >
      <form onSubmit={onFormSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          name="email"
          type="email"
          label="Email"
          placeholder="nome@escola.pt"
          autoComplete="email"
          inputMode="email"
          value={email}
          error={visibleErrors.email}
          icon={<MailIcon />}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, email: true }));
            setFieldErrors((prev) => ({ ...prev, email: runValidation(email, password).email }));
          }}
        />

        <Field
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          error={visibleErrors.password}
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
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, password: true }));
            setFieldErrors((prev) => ({
              ...prev,
              password: runValidation(email, password).password,
            }));
          }}
        />

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-campus-accent">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded-none border-campus-border accent-campus-primary"
            />
            Lembrar email
          </label>
          <button
            type="button"
            className="text-campus-accent transition-colors hover:text-campus-primary"
            onClick={() => setForgotOpen(true)}
          >
            Esqueceste a password?
          </button>
        </div>

        {error && <Alert title="Não foi possível entrar" message={error} />}

        <AuthSubmitButton loading={isSubmitting} loadingLabel="A entrar…" disabled={!canSubmit}>
          Entrar
        </AuthSubmitButton>
      </form>
    </AuthPanel>
    </>
  );
};
