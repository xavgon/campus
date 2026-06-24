import type { LiveMediaType } from '@/features/live/types/live.types';
import { IS_ELECTRON } from '@/shared/utils/isElectron';

export const LIVE_TYPE_VIDEO = 0x01;
export const LIVE_TYPE_AUDIO = 0x02;

const desktopTuning = IS_ELECTRON;

/** FPS do stream JPEG — alinhado com gravação FFmpeg (15) */
export const LIVE_VIDEO_FPS = desktopTuning ? 12 : 15;

/** Pré-visualização local do broadcaster */
export const LIVE_VIDEO_WIDTH = 640;
export const LIVE_VIDEO_HEIGHT = 360;

/** Resolução enviada aos ouvintes (16:9) */
export const LIVE_VIDEO_STREAM_WIDTH = desktopTuning ? 480 : 640;
export const LIVE_VIDEO_STREAM_HEIGHT = desktopTuning ? 270 : 360;

export const LIVE_JPEG_QUALITY = desktopTuning ? 0.55 : 0.62;

export const LIVE_AUDIO_SAMPLE_RATE = 44100;
/** ~46 ms por chunk — menor latência percebida */
export const LIVE_AUDIO_CHUNK_SAMPLES = 2048;

/**
 * Backpressure no broadcaster.
 * Áudio tem prioridade; vídeo é descartado primeiro sob carga.
 */
export const LIVE_WS_MAX_BUFFER = desktopTuning ? 768 * 1024 : 1536 * 1024;
export const LIVE_WS_MAX_BUFFER_VIDEO = desktopTuning ? 384 * 1024 : 640 * 1024;

export const LIVE_MEDIA_OPTIONS: { value: LiveMediaType; label: string }[] = [
  { value: 'audio', label: 'Áudio' },
  { value: 'video', label: 'Vídeo' },
  { value: 'both', label: 'Vídeo + áudio' },
];

export const LIVE_POLL_INTERVAL_MS = 5000;
