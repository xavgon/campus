import {
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

export const startLiveCapture = async (
  mediaType: LiveMediaType,
  previewCanvas: HTMLCanvasElement | null,
  onChunk: (data: Uint8Array) => void,
): Promise<LiveCaptureHandles> => {
  const wantsVideo = wantsLiveVideo(mediaType);
  const wantsAudio = wantsLiveAudio(mediaType);

  const stream = await navigator.mediaDevices.getUserMedia({
    video: wantsVideo,
    audio: wantsAudio,
  });

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

    const previewCtx = previewCanvas?.getContext('2d') ?? null;

    const streamCanvas = document.createElement('canvas');
    streamCanvas.width = LIVE_VIDEO_STREAM_WIDTH;
    streamCanvas.height = LIVE_VIDEO_STREAM_HEIGHT;
    const streamCtx = streamCanvas.getContext('2d');
    if (!streamCtx) throw new Error('Canvas de stream não suportado');

    let stopped = false;
    let encoding = false;
    let frameTimer: ReturnType<typeof setTimeout> | null = null;
    const frameIntervalMs = Math.round(1000 / LIVE_VIDEO_FPS);

    const captureFrame = () => {
      if (stopped) return;

      if (encoding) {
        frameTimer = setTimeout(captureFrame, frameIntervalMs);
        return;
      }

      if (videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        frameTimer = setTimeout(captureFrame, frameIntervalMs);
        return;
      }

      if (previewCtx && previewCanvas) {
        previewCtx.drawImage(videoEl, 0, 0, LIVE_VIDEO_WIDTH, LIVE_VIDEO_HEIGHT);
      }
      streamCtx.drawImage(videoEl, 0, 0, LIVE_VIDEO_STREAM_WIDTH, LIVE_VIDEO_STREAM_HEIGHT);

      encoding = true;
      streamCanvas.toBlob(
        (blob) => {
          encoding = false;
          if (stopped || !blob) {
            if (!stopped) frameTimer = setTimeout(captureFrame, frameIntervalMs);
            return;
          }

          void blob.arrayBuffer().then((buf) => {
            if (stopped) return;
            const out = new Uint8Array(1 + buf.byteLength);
            out[0] = LIVE_TYPE_VIDEO;
            out.set(new Uint8Array(buf), 1);
            onChunk(out);
          });

          if (!stopped) {
            frameTimer = setTimeout(captureFrame, frameIntervalMs);
          }
        },
        'image/jpeg',
        LIVE_JPEG_QUALITY,
      );
    };

    frameTimer = setTimeout(captureFrame, frameIntervalMs);

    clearVideoCapture = () => {
      stopped = true;
      if (frameTimer) clearTimeout(frameTimer);
    };
  }

  if (wantsAudio) {
    audioContext = new AudioContext({ sampleRate: LIVE_AUDIO_SAMPLE_RATE });
    const source = audioContext.createMediaStreamSource(stream);
    audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
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
  new AudioContext({ sampleRate: LIVE_AUDIO_SAMPLE_RATE });

export const playLiveAudioChunk = (audioContext: AudioContext, buffer: ArrayBuffer): void => {
  const int16 = new Int16Array(buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32767;
  }
  const audioBuf = audioContext.createBuffer(1, float32.length, LIVE_AUDIO_SAMPLE_RATE);
  audioBuf.getChannelData(0).set(float32);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuf;
  source.connect(audioContext.destination);
  source.start();
};

export const formatLiveDuration = (startedAt: string): string => {
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};
