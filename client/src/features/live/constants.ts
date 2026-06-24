import type { LiveMediaType } from '@/features/live/types/live.types';
import { IS_ELECTRON } from '@/shared/utils/isElectron';

export const LIVE_TYPE_VIDEO = 0x01;
export const LIVE_TYPE_AUDIO = 0x02;

const desktopTuning = IS_ELECTRON;

/** FPS efectivo do stream (JPEG) */
export const LIVE_VIDEO_FPS = desktopTuning ? 8 : 12;
/** Pré-visualização local do broadcaster */
export const LIVE_VIDEO_WIDTH = 640;
export const LIVE_VIDEO_HEIGHT = 480;
/** Resolução enviada aos ouvintes */
export const LIVE_VIDEO_STREAM_WIDTH = desktopTuning ? 320 : 480;
export const LIVE_VIDEO_STREAM_HEIGHT = desktopTuning ? 240 : 360;
export const LIVE_JPEG_QUALITY = desktopTuning ? 0.42 : 0.52;
export const LIVE_AUDIO_SAMPLE_RATE = 44100;
/** Backpressure WebSocket no broadcaster — mais baixo no Electron */
export const LIVE_WS_MAX_BUFFER = desktopTuning ? 96 * 1024 : 384 * 1024;

export const LIVE_MEDIA_OPTIONS: { value: LiveMediaType; label: string }[] = [
  { value: 'audio', label: 'Áudio' },
  { value: 'video', label: 'Vídeo' },
  { value: 'both', label: 'Vídeo + áudio' },
];

export const LIVE_POLL_INTERVAL_MS = 5000;
