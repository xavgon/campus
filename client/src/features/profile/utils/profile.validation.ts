export interface ProfileNameErrors {
  nome?: string;
}

export interface ChangePasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const validateProfileName = (nome: string): ProfileNameErrors => {
  const trimmed = nome.trim();
  const errors: ProfileNameErrors = {};

  if (!trimmed) {
    errors.nome = 'Indica o teu nome.';
  } else if (trimmed.length < 2) {
    errors.nome = 'O nome deve ter pelo menos 2 caracteres.';
  } else if (trimmed.length > 120) {
    errors.nome = 'O nome é demasiado longo.';
  }

  return errors;
};

export const validateChangePassword = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): ChangePasswordErrors => {
  const errors: ChangePasswordErrors = {};

  if (!currentPassword) {
    errors.currentPassword = 'Indica a password atual.';
  }
  if (!newPassword) {
    errors.newPassword = 'Indica a nova password.';
  } else if (newPassword.length < 6) {
    errors.newPassword = 'Mínimo de 6 caracteres.';
  }
  if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'As passwords não coincidem.';
  }
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'A nova password deve ser diferente da atual.';
  }

  return errors;
};

export const hasFieldErrors = (errors: object): boolean =>
  Object.values(errors).some(Boolean);
