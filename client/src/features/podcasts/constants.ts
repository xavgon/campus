/** Valor do select quando o utilizador indica categoria personalizada (sem ID na BD). */
export const CATEGORY_OTHER_ID = 'other';

export const PUBLISH_LIMITS = {
  titleMax: 200,
  descriptionMax: 5000,
  categoryOtherMax: 80,
  audioMaxMb: 50,
  coverMaxMb: 2,
} as const;

export const AUDIO_ACCEPT = 'audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a';
export const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv';
export const COVER_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
