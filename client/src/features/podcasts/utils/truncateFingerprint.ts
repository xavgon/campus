export const truncateFingerprint = (value: string): string => {
  if (value.length <= 24) return value;
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
};
