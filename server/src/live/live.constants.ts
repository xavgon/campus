/** Protocolo binário WS (espelha client/src/features/live/constants.ts) */
export const LIVE_TYPE_VIDEO = 0x01;
export const LIVE_TYPE_AUDIO = 0x02;

/** FPS assumido pelo FFmpeg na gravação MJPEG → H.264 */
export const LIVE_RECORDING_VIDEO_FPS = 15;

/** Backpressure por listener — vídeo pode saltar; áudio é prioritário */
export const LIVE_LISTENER_BUFFER_VIDEO = 768 * 1024;
export const LIVE_LISTENER_BUFFER_AUDIO = 2 * 1024 * 1024;
