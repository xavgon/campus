import type { LiveMediaType } from '@/features/live/types/live.types';
import { wantsLiveAudio, wantsLiveVideo } from '@/features/live/utils/liveMedia';

export interface LiveRecordingResult {
  audioBlob: Blob | null;
  videoBlob: Blob | null;
}

const pickMimeType = (candidates: string[]): string | undefined =>
  candidates.find((mime) => MediaRecorder.isTypeSupported(mime));

const AUDIO_MIME = pickMimeType(['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']);
const VIDEO_MIME = pickMimeType([
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]);

const waitForRecorderStop = (recorder: MediaRecorder): Promise<void> =>
  new Promise((resolve) => {
    if (recorder.state === 'inactive') {
      resolve();
      return;
    }
    recorder.addEventListener('stop', () => resolve(), { once: true });
    recorder.stop();
  });

export const createLiveRecorders = (
  stream: MediaStream,
  mediaType: LiveMediaType,
): { stop: () => Promise<LiveRecordingResult> } => {
  const wantsVideo = wantsLiveVideo(mediaType);
  const wantsAudio = wantsLiveAudio(mediaType);
  const audioChunks: Blob[] = [];
  const videoChunks: Blob[] = [];
  const recorders: MediaRecorder[] = [];

  if (wantsAudio && AUDIO_MIME) {
    const audioStream = wantsVideo
      ? new MediaStream(stream.getAudioTracks())
      : stream;
    const recorder = new MediaRecorder(audioStream, { mimeType: AUDIO_MIME });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };
    recorder.start(1000);
    recorders.push(recorder);
  }

  if (wantsVideo && VIDEO_MIME) {
    const recorder = new MediaRecorder(stream, { mimeType: VIDEO_MIME });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) videoChunks.push(event.data);
    };
    recorder.start(1000);
    recorders.push(recorder);
  }

  return {
    stop: async () => {
      await Promise.all(recorders.map(waitForRecorderStop));

      return {
        audioBlob:
          audioChunks.length > 0
            ? new Blob(audioChunks, { type: AUDIO_MIME ?? 'audio/webm' })
            : null,
        videoBlob:
          videoChunks.length > 0
            ? new Blob(videoChunks, { type: VIDEO_MIME ?? 'video/webm' })
            : null,
      };
    },
  };
};

export type LiveEpisodeFormat = 'audio' | 'audiovideo';

export const recordingHasVideo = (recording: LiveRecordingResult): boolean =>
  Boolean(recording.videoBlob && recording.videoBlob.size > 0);

export const recordingHasAudio = (recording: LiveRecordingResult): boolean =>
  Boolean(recording.audioBlob && recording.audioBlob.size > 0);

export const blobToFile = (blob: Blob, filename: string): File => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const fallback =
    ext === 'webm'
      ? filename.includes('audio')
        ? 'audio/webm'
        : 'video/webm'
      : ext === 'mp4'
        ? filename.includes('audio')
          ? 'audio/mp4'
          : 'video/mp4'
        : 'application/octet-stream';

  // MediaRecorder usa tipos com codecs (ex.: video/webm;codecs=vp9,opus) — normalizar
  const type = blob.type.split(';')[0]?.trim().toLowerCase() || fallback;
  return new File([blob], filename, { type });
};

export const formatRecordingDuration = (startedAtMs: number): string => {
  const seconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const formatBlobSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
