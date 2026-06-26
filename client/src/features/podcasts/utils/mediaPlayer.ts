/** Segundos de avanço/retrocesso nos controlos do player (RF08). */
export const SKIP_SECONDS = 10;

export const formatPlayerTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const mm = minutes.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${minutes}:${ss}`;
};
