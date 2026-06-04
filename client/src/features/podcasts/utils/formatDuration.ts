export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '—';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  }
  return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
};
