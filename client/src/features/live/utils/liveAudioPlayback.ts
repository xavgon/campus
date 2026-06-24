import { LIVE_AUDIO_SAMPLE_RATE } from '@/features/live/constants';

const JITTER_BUFFER_S = 0.12;
const MAX_AHEAD_S = 0.4;
const MAX_BEHIND_RESET_S = 0.18;

export interface AudioScheduleState {
  next: number;
}

export const createAudioScheduleState = (): AudioScheduleState => ({ next: 0 });

export const resetAudioSchedule = (
  schedule: AudioScheduleState,
  audioContext: AudioContext,
): void => {
  schedule.next = audioContext.currentTime + JITTER_BUFFER_S;
};

export const playLiveAudioChunk = (
  audioContext: AudioContext,
  buffer: ArrayBuffer,
  schedule: AudioScheduleState,
): void => {
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

  const duration = float32.length / LIVE_AUDIO_SAMPLE_RATE;
  const now = audioContext.currentTime;

  if (schedule.next <= now) {
    schedule.next = now + JITTER_BUFFER_S;
  }

  if (schedule.next > now + MAX_AHEAD_S) {
    schedule.next = now + JITTER_BUFFER_S;
  }

  if (schedule.next < now - MAX_BEHIND_RESET_S) {
    schedule.next = now + JITTER_BUFFER_S;
  }

  source.start(schedule.next);
  schedule.next += duration;
};
