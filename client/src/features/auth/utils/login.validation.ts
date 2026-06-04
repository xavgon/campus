export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLoginFields = (email: string, password: string): LoginFieldErrors => {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'Indica o teu email.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Introduz um email válido.';
  }

  if (!password) {
    errors.password = 'Indica a tua password.';
  }

  return errors;
};

export const hasLoginFieldErrors = (errors: LoginFieldErrors): boolean =>
  Boolean(errors.email || errors.password);
