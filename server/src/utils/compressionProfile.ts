/** Perfis de compressão de áudio (espelham server/src/compression/compress.ts — RF05). */
export const AUDIO_COMPRESSION_PROFILES: Record<string, string> = {
  mp3: 'MP3 · 128 kbps · mono',
  aac: 'AAC · 128 kbps',
  ogg: 'OGG Vorbis · qualidade 4 (~128 kbps)',
};

export const VIDEO_COMPRESSION_PROFILES: Record<string, string> = {
  mp4: 'H.264 · CRF 23 · AAC 128 kbps',
  webm: 'VP9 · CRF 33 · Opus 128 kbps',
};

export const getAudioCompressionProfile = (mediaFormat: string | null | undefined): string | null => {
  if (!mediaFormat) return null;
  return AUDIO_COMPRESSION_PROFILES[mediaFormat.toLowerCase()] ?? null;
};

export const getVideoCompressionProfile = (mediaFormat: string | null | undefined): string | null => {
  if (!mediaFormat) return null;
  return VIDEO_COMPRESSION_PROFILES[mediaFormat.toLowerCase()] ?? null;
};

export const getCompressionProfileLabel = (
  mediaFormat?: string | null,
  mediaType?: 'audio' | 'video',
): string | null => {
  if (!mediaFormat) return null;
  const key = mediaFormat.toLowerCase();
  if (mediaType === 'video' || key === 'mp4' || key === 'webm') {
    return getVideoCompressionProfile(key);
  }
  return getAudioCompressionProfile(key);
};
