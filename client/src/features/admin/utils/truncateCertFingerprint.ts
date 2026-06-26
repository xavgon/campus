/** Trunca fingerprint SHA-256 para exibição em tabelas admin. */
export const truncateCertFingerprint = (value: string | null | undefined): string => {
  if (!value) return '—';
  if (value.length <= 28) return value;
  return `${value.slice(0, 14)}…${value.slice(-10)}`;
};
