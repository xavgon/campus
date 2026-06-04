export interface RegisterFieldErrors {
  nome?: string;
  email?: string;
  password?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegisterFields = (
  nome: string,
  email: string,
  password: string,
): RegisterFieldErrors => {
  const errors: RegisterFieldErrors = {};
  const trimmedNome = nome.trim();
  const trimmedEmail = email.trim();

  if (!trimmedNome) {
    errors.nome = 'Indica o teu nome.';
  } else if (trimmedNome.length < 2) {
    errors.nome = 'O nome deve ter pelo menos 2 caracteres.';
  }

  if (!trimmedEmail) {
    errors.email = 'Indica o teu email.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Introduz um email válido.';
  }

  if (!password) {
    errors.password = 'Escolhe uma password.';
  } else if (password.length < 6) {
    errors.password = 'A password deve ter pelo menos 6 caracteres.';
  }

  return errors;
};

export const hasRegisterFieldErrors = (errors: RegisterFieldErrors): boolean =>
  Boolean(errors.nome || errors.email || errors.password);
