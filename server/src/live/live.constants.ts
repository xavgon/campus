/** Protocolo binário WS (espelha client/src/features/live/constants.ts) */
export const LIVE_TYPE_VIDEO = 0x01;
export const LIVE_TYPE_AUDIO = 0x02;

/** FPS assumido pelo FFmpeg na gravação MJPEG → H.264 */
export const LIVE_RECORDING_VIDEO_FPS = 15;

/** Backpressure por listener — vídeo pode saltar; áudio é prioritário */
export const LIVE_LISTENER_BUFFER_VIDEO = 768 * 1024;
export const LIVE_LISTENER_BUFFER_AUDIO = 2 * 1024 * 1024;

/** Tempo para o anfitrião reconectar antes de terminar a sessão */
export const LIVE_BROADCASTER_RECONNECT_MS = 30_000;

/** Comentários em tempo real na transmissão */
export const LIVE_COMMENT_MAX_LENGTH = 500;
export const LIVE_COMMENT_MIN_INTERVAL_MS = 2_000;
export const LIVE_COMMENTS_HISTORY_LIMIT = 100;
