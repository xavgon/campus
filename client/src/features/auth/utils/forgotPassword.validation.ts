const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateForgotPasswordEmail = (email: string): string | undefined => {
  const trimmed = email.trim();
  if (!trimmed) return 'Indica o teu email.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Introduz um email válido.';
  return undefined;
};
