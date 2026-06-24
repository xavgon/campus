export const parseFfmpegTimeSeconds = (text: string): number | null => {
  const matches = [...text.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)];
  if (matches.length === 0) return null;

  const last = matches[matches.length - 1];
  return Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]);
};

export const ffmpegProgressPercent = (
  stderrChunk: string,
  durationSeconds: number,
): number | null => {
  const currentSeconds = parseFfmpegTimeSeconds(stderrChunk);
  if (currentSeconds == null || durationSeconds <= 0) return null;
  return Math.min(99, (currentSeconds / durationSeconds) * 100);
};
