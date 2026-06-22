import type { LiveMediaType } from '@/features/live/types/live.types';

export const LIVE_TYPE_VIDEO = 0x01;
export const LIVE_TYPE_AUDIO = 0x02;

/** FPS efectivo do stream (JPEG) — baixo para reduzir latência */
export const LIVE_VIDEO_FPS = 12;
/** Pré-visualização local do broadcaster */
export const LIVE_VIDEO_WIDTH = 640;
export const LIVE_VIDEO_HEIGHT = 480;
/** Resolução enviada aos ouvintes (menor = menos travamentos) */
export const LIVE_VIDEO_STREAM_WIDTH = 480;
export const LIVE_VIDEO_STREAM_HEIGHT = 360;
export const LIVE_JPEG_QUALITY = 0.52;
export const LIVE_AUDIO_SAMPLE_RATE = 44100;

export const LIVE_MEDIA_OPTIONS: { value: LiveMediaType; label: string }[] = [
  { value: 'audio', label: 'Áudio' },
  { value: 'video', label: 'Vídeo' },
  { value: 'both', label: 'Vídeo + áudio' },
];

export const LIVE_POLL_INTERVAL_MS = 5000;
