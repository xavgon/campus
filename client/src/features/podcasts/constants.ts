/** Categorias placeholder até existir GET /categories */
export const PODCAST_CATEGORIES = [
  { id: '1', name: 'Educação geral' },
  { id: '2', name: 'Ciências' },
  { id: '3', name: 'História' },
  { id: '4', name: 'Línguas' },
  { id: '5', name: 'Tecnologia' },
  { id: '6', name: 'Artes' },
] as const;

/** Valor do select quando o utilizador indica categoria personalizada */
export const CATEGORY_OTHER_ID = 'other';

export const PUBLISH_LIMITS = {
  titleMax: 200,
  descriptionMax: 5000,
  categoryOtherMax: 80,
  audioMaxMb: 50,
  coverMaxMb: 2,
} as const;

export const AUDIO_ACCEPT = 'audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,.mp3,.wav,.m4a';
export const COVER_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
