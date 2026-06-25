import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthFormSkeleton } from '@/features/auth/components/AuthFormSkeleton';
import { AuthSubmitButton } from '@/features/auth/components/AuthSubmitButton';
import { LockIcon, MailIcon, UserIcon } from '@/features/auth/components/icons';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthForm } from '@/features/auth/hooks/useAuthForm';
import {
  hasRegisterFieldErrors,
  validateRegisterFields,
  type RegisterFieldErrors,
} from '@/features/auth/utils/register.validation';
import { ERROR_TITLES } from '@/shared/copy/campusMessages';
import { Alert } from '@/shared/components/campus/Alert';
import { AuthPanel } from '@/shared/components/campus/AuthPanel';
import { Field } from '@/shared/components/campus/Field';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [touched, setTouched] = useState({ nome: false, email: false, password: false });

  // Hook must be called before any early return
  const { error, isSubmitting, handleSubmit, setError } = useAuthForm(async () => {
    await register({ nome: nome.trim(), email: email.trim(), password });
    void navigate('/dashboard');
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const runValidation = (nextNome = nome, nextEmail = email, nextPassword = password) =>
    validateRegisterFields(nextNome, nextEmail, nextPassword);

  const clearFieldError = (field: keyof RegisterFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const onFormSubmit = (event: FormEvent) => {
    const errors = runValidation();
    setFieldErrors(errors);
    setTouched({ nome: true, email: true, password: true });

    if (hasRegisterFieldErrors(errors)) {
      event.preventDefault();
      setError(null);
      return;
    }

    handleSubmit(event);
  };

  const visibleErrors = {
    nome: touched.nome ? fieldErrors.nome : undefined,
    email: touched.email ? fieldErrors.email : undefined,
    password: touched.password ? fieldErrors.password : undefined,
  };

  const canSubmit =
    nome.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length > 0 &&
    !hasRegisterFieldErrors(runValidation());

  if (isLoading) {
    return <AuthFormSkeleton />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthPanel
      title="Criar conta"
      subtitle="Preenche os dados abaixo para começares a usar o CAMPUS."
      footerText="Já tens conta?"
      footerHref="/login"
      footerLabel="Iniciar sessão"
    >
      <form onSubmit={onFormSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          name="nome"
          type="text"
          label="Nome"
          placeholder="O teu nome completo"
          autoComplete="name"
          value={nome}
          error={visibleErrors.nome}
          icon={<UserIcon />}
          onChange={(e) => {
            setNome(e.target.value);
            clearFieldError('nome');
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, nome: true }));
            setFieldErrors((prev) => ({ ...prev, nome: runValidation(nome, email, password).nome }));
          }}
        />

        <Field
          name="email"
          type="email"
          label="Email"
          placeholder="nome@escola.pt"
          autoComplete="email"
          value={email}
          error={visibleErrors.email}
          icon={<MailIcon />}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, email: true }));
            setFieldErrors((prev) => ({ ...prev, email: runValidation(nome, email, password).email }));
          }}
        />

        <Field
          name="password"
          type="password"
          label="Password"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          value={password}
          error={visibleErrors.password}
          hint="Usa pelo menos 6 caracteres."
          icon={<LockIcon />}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          onBlur={() => {
            setTouched((t) => ({ ...t, password: true }));
            setFieldErrors((prev) => ({
              ...prev,
              password: runValidation(nome, email, password).password,
            }));
          }}
        />

        {error && <Alert title={ERROR_TITLES.register} message={error} />}

        <AuthSubmitButton loading={isSubmitting} loadingLabel="A criar conta…" disabled={!canSubmit}>
          Criar conta
        </AuthSubmitButton>
      </form>
    </AuthPanel>
  );
};
