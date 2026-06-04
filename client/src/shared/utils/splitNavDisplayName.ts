const BRAND_SUFFIX = ' CAMPUS';

export const splitNavDisplayName = (nome: string): { lead: string; trail: string | null } => {
  const trimmed = nome.trim();
  if (trimmed.endsWith(BRAND_SUFFIX)) {
    return {
      lead: trimmed.slice(0, -BRAND_SUFFIX.length).trim(),
      trail: 'CAMPUS',
    };
  }
  return { lead: trimmed, trail: null };
};
