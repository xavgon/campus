import { useEffect, useState, type FormEvent } from 'react';
import { MailIcon } from '@/features/auth/components/icons';
import { requestPasswordReset } from '@/features/auth/services/auth.service';
import { validateForgotPasswordEmail } from '@/features/auth/utils/forgotPassword.validation';
import { Alert } from '@/shared/components/campus/Alert';
import { Modal } from '@/shared/components/campus/Modal';
import { SuccessNotice } from '@/shared/components/campus/SuccessNotice';
import { Field } from '@/shared/components/campus/Field';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/shared/api/client';
import { ERROR_TITLES } from '@/shared/copy/campusMessages';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal = ({ open, onClose, initialEmail = '' }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(initialEmail);
    setError(null);
    setFieldError(undefined);
    setIsSubmitting(false);
    setIsSuccess(false);
  }, [open, initialEmail]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateForgotPasswordEmail(email);
    setFieldError(validationError);

    if (validationError) {
      setError(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    void requestPasswordReset(email.trim())
      .then(() => setIsSuccess(true))
      .catch((err: unknown) => setError(getApiErrorMessage(err)))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Recuperar password"
      description="Indica o email da tua conta. Se existir no CAMPUS, enviaremos instruções para redefinires a password."
    >
      {isSuccess ? (
        <div className="flex flex-col gap-5">
          <SuccessNotice
            title="Pedido enviado"
            message="Se o email estiver registado, vais receber um link para criar uma nova password. Verifica também a pasta de spam."
          />
          <Button fullWidth onClick={handleClose}>
            Fechar
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field
            name="reset-email"
            type="email"
            label="Email"
            placeholder="nome@escola.pt"
            autoComplete="email"
            inputMode="email"
            value={email}
            error={fieldError}
            icon={<MailIcon />}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldError(undefined);
              setError(null);
            }}
            onBlur={() => setFieldError(validateForgotPasswordEmail(email))}
          />

          {error && <Alert title={ERROR_TITLES.forgotPassword} message={error} />}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" fullWidth className="sm:w-auto" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" fullWidth className="sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? 'A enviar…' : 'Enviar link'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
