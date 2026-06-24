import {
  LIVE_AUDIO_CHUNK_SAMPLES,
  LIVE_AUDIO_SAMPLE_RATE,
  LIVE_JPEG_QUALITY,
  LIVE_TYPE_AUDIO,
  LIVE_TYPE_VIDEO,
  LIVE_VIDEO_FPS,
  LIVE_VIDEO_HEIGHT,
  LIVE_VIDEO_STREAM_HEIGHT,
  LIVE_VIDEO_STREAM_WIDTH,
  LIVE_VIDEO_WIDTH,
} from '@/features/live/constants';
import type { LiveMediaType } from '@/features/live/types/live.types';
import { createLiveRecorders, type LiveRecordingResult } from '@/features/live/utils/liveRecording';

export interface LiveCaptureHandles {
  stop: () => Promise<LiveRecordingResult>;
}

export type { LiveRecordingResult };

export const wantsLiveVideo = (mediaType: LiveMediaType): boolean =>
  mediaType === 'video' || mediaType === 'both';

export const wantsLiveAudio = (mediaType: LiveMediaType): boolean =>
  mediaType === 'audio' || mediaType === 'both';

const buildMediaConstraints = (
  wantsVideo: boolean,
  wantsAudio: boolean,
): MediaStreamConstraints => ({
  video: wantsVideo
    ? {
        width: { ideal: LIVE_VIDEO_STREAM_WIDTH },
        height: { ideal: LIVE_VIDEO_STREAM_HEIGHT },
        frameRate: { ideal: LIVE_VIDEO_FPS, max: LIVE_VIDEO_FPS + 3 },
      }
    : false,
  audio: wantsAudio
    ? {
        channelCount: 1,
        sampleRate: { ideal: LIVE_AUDIO_SAMPLE_RATE },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    : false,
});

export const startLiveCapture = async (
  mediaType: LiveMediaType,
  previewCanvas: HTMLCanvasElement | null,
  onChunk: (data: Uint8Array) => void,
): Promise<LiveCaptureHandles> => {
  const wantsVideo = wantsLiveVideo(mediaType);
  const wantsAudio = wantsLiveAudio(mediaType);

  const stream = await navigator.mediaDevices.getUserMedia(
    buildMediaConstraints(wantsVideo, wantsAudio),
  );

  const liveRecorder = createLiveRecorders(stream, mediaType);

  let clearVideoCapture: (() => void) | null = null;
  let audioProcessor: ScriptProcessorNode | null = null;
  let audioContext: AudioContext | null = null;

  if (wantsVideo) {
    const videoEl = document.createElement('video');
    videoEl.srcObject = stream;
    videoEl.muted = true;
    videoEl.playsInline = true;
    await videoEl.play();

    const previewCtx = previewCanvas?.getContext('2d', { alpha: false }) ?? null;
    if (previewCtx) {
      previewCtx.imageSmoothingEnabled = true;
      previewCtx.imageSmoothingQuality = 'medium';
    }

    const streamCanvas = document.createElement('canvas');
    streamCanvas.width = LIVE_VIDEO_STREAM_WIDTH;
    streamCanvas.height = LIVE_VIDEO_STREAM_HEIGHT;
    const streamCtx = streamCanvas.getContext('2d', { alpha: false });
    if (!streamCtx) throw new Error('Canvas de stream não suportado');
    streamCtx.imageSmoothingEnabled = true;
    streamCtx.imageSmoothingQuality = 'medium';

    let stopped = false;
    let encoding = false;
    let frameTimer: ReturnType<typeof setTimeout> | null = null;
    let previewTick = 0;
    let lastCaptureMs = 0;
    const frameIntervalMs = Math.round(1000 / LIVE_VIDEO_FPS);

    const captureFrame = () => {
      if (stopped) return;

      if (encoding) {
        scheduleNextFrame();
        return;
      }

      if (videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        scheduleNextFrame();
        return;
      }

      const now = performance.now();
      if (now - lastCaptureMs < frameIntervalMs * 0.9) {
        scheduleNextFrame();
        return;
      }
      lastCaptureMs = now;

      if (previewCtx && previewCanvas && previewTick++ % 3 === 0) {
        previewCtx.drawImage(videoEl, 0, 0, LIVE_VIDEO_WIDTH, LIVE_VIDEO_HEIGHT);
      }
      streamCtx.drawImage(videoEl, 0, 0, LIVE_VIDEO_STREAM_WIDTH, LIVE_VIDEO_STREAM_HEIGHT);

      encoding = true;
      streamCanvas.toBlob(
        (blob) => {
          encoding = false;
          if (stopped || !blob) {
            if (!stopped) scheduleNextFrame();
            return;
          }

          void blob.arrayBuffer().then((buf) => {
            if (stopped) return;
            const out = new Uint8Array(1 + buf.byteLength);
            out[0] = LIVE_TYPE_VIDEO;
            out.set(new Uint8Array(buf), 1);
            onChunk(out);
          });

          if (!stopped) scheduleNextFrame();
        },
        'image/jpeg',
        LIVE_JPEG_QUALITY,
      );
    };

    const scheduleNextFrame = () => {
      if (stopped) return;
      frameTimer = setTimeout(captureFrame, frameIntervalMs);
    };

    scheduleNextFrame();

    clearVideoCapture = () => {
      stopped = true;
      if (frameTimer) clearTimeout(frameTimer);
    };
  }

  if (wantsAudio) {
    audioContext = new AudioContext({
      sampleRate: LIVE_AUDIO_SAMPLE_RATE,
      latencyHint: 'interactive',
    });
    await audioContext.resume();

    const source = audioContext.createMediaStreamSource(stream);
    audioProcessor = audioContext.createScriptProcessor(LIVE_AUDIO_CHUNK_SAMPLES, 1, 1);
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    source.connect(audioProcessor);
    audioProcessor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    audioProcessor.onaudioprocess = (event) => {
      const pcm = event.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, pcm[i] * 32767));
      }
      const out = new Uint8Array(1 + int16.byteLength);
      out[0] = LIVE_TYPE_AUDIO;
      out.set(new Uint8Array(int16.buffer), 1);
      onChunk(out);
    };
  }

  return {
    stop: async () => {
      clearVideoCapture?.();
      if (audioProcessor) audioProcessor.disconnect();
      if (audioContext) void audioContext.close();
      stream.getTracks().forEach((track) => track.stop());
      return liveRecorder.stop();
    },
  };
};

export const createListenerAudioContext = (): AudioContext =>
  new AudioContext({
    sampleRate: LIVE_AUDIO_SAMPLE_RATE,
    latencyHint: 'interactive',
  });

export { playLiveAudioChunk } from '@/features/live/utils/liveAudioPlayback';

export const formatLiveDuration = (startedAt: string): string => {
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};
