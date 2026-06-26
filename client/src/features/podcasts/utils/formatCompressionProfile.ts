/** Perfis de compressão — etiquetas para a UI (RF05). */
export const AUDIO_COMPRESSION_PROFILES: Record<string, string> = {
  mp3: 'MP3 · 128 kbps · mono',
  aac: 'AAC · 128 kbps',
  ogg: 'OGG Vorbis · qualidade 4 (~128 kbps)',
};

export const VIDEO_COMPRESSION_PROFILES: Record<string, string> = {
  mp4: 'H.264 · CRF 23 · AAC 128 kbps',
  webm: 'VP9 · CRF 33 · Opus 128 kbps',
};

export const getCompressionProfileLabel = (
  mediaFormat?: string | null,
  mediaType?: 'audio' | 'video',
): string | null => {
  if (!mediaFormat) return null;
  const key = mediaFormat.toLowerCase();
  if (mediaType === 'video' || key === 'mp4' || key === 'webm') {
    return VIDEO_COMPRESSION_PROFILES[key] ?? null;
  }
  return AUDIO_COMPRESSION_PROFILES[key] ?? null;
};

export const getExpectedCompressionProfile = (sourceFormat?: string | null): string => {
  const key = sourceFormat?.toLowerCase() ?? '';
  if (key === 'ogg') return AUDIO_COMPRESSION_PROFILES.ogg;
  if (key === 'aac' || key === 'm4a') return AUDIO_COMPRESSION_PROFILES.aac;
  if (key === 'mp3') return AUDIO_COMPRESSION_PROFILES.mp3;
  return AUDIO_COMPRESSION_PROFILES.mp3;
};
