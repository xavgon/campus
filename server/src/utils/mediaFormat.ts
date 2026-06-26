import path from 'path';

/** Normaliza extensão de ficheiro para etiqueta de formato (RF04). */
export const formatFromMediaPath = (filenameOrUrl: string): string => {
  const ext = path.extname(filenameOrUrl).slice(1).toLowerCase();
  if (!ext) return 'unknown';
  if (ext === 'm4a') return 'aac';
  if (ext === 'jpeg') return 'jpg';
  return ext;
};

export const roundDurationSeconds = (seconds: number | null | undefined): number | null => {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.round(seconds));
};
