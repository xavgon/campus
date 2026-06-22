export interface ResetPasswordFieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export const validateResetPasswordFields = (
  newPassword: string,
  confirmPassword: string,
): ResetPasswordFieldErrors => {
  const errors: ResetPasswordFieldErrors = {};

  if (!newPassword) {
    errors.newPassword = 'Indica a nova password.';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'A password deve ter pelo menos 6 caracteres.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirma a nova password.';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'As passwords não coincidem.';
  }

  return errors;
};

export const hasResetPasswordFieldErrors = (errors: ResetPasswordFieldErrors): boolean =>
  Boolean(errors.newPassword || errors.confirmPassword);
