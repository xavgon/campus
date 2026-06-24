import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import type { MediaType } from './live.gateway';
import { LIVE_RECORDING_VIDEO_FPS } from './live.constants';

// ─── Pasta de gravações ───────────────────────────────────────────────────────

const recordingsDir = path.join(config.uploadDir, 'recordings');
if (!fs.existsSync(recordingsDir)) fs.mkdirSync(recordingsDir, { recursive: true });

// ─── Gravações concluídas (em memória) ───────────────────────────────────────

export interface Recording {
  id: string;
  title: string;
  mediaType: MediaType;
  audioFile?: string; // caminho relativo para servir via HTTP
  videoFile?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

const completed = new Map<string, Recording>();

export const getCompletedRecordings = (): Recording[] =>
  Array.from(completed.values()).sort(
    (a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime(),
  );

export const getRecordingById = (id: string): Recording | undefined => completed.get(id);

// ─── LiveRecorder ─────────────────────────────────────────────────────────────

export class LiveRecorder {
  private audioProc?: ChildProcess;
  private videoProc?: ChildProcess;
  private audioRelPath?: string;
  private videoRelPath?: string;
  private startedAt: Date;

  constructor(
    private readonly sessionId: string,
    private readonly title: string,
    private readonly mediaType: MediaType,
  ) {
    this.startedAt = new Date();

    if (mediaType === 'audio' || mediaType === 'both') {
      this.startAudio();
    }
    if (mediaType === 'video' || mediaType === 'both') {
      this.startVideo();
    }

    console.info(`[REC] A gravar "${title}" (${mediaType})`);
  }

  // ── Iniciar processos FFmpeg ────────────────────────────────────────────────

  private startAudio(): void {
    const filename = `audio_${this.sessionId}.mp3`;
    const outPath = path.join(recordingsDir, filename);
    this.audioRelPath = `uploads/recordings/${filename}`;

    this.audioProc = spawn(config.ffmpegPath, [
      '-y',
      '-f', 's16le', '-ar', '44100', '-ac', '1',
      '-i', 'pipe:0',
      '-codec:a', 'libmp3lame', '-b:a', '128k',
      outPath,
    ]);
    this.audioProc.stderr?.on('data', () => {}); // suprime output do FFmpeg
    this.audioProc.on('error', (e) =>
      console.error(`[REC] Erro FFmpeg áudio: ${e.message}`),
    );
  }

  private startVideo(): void {
    const filename = `video_${this.sessionId}.mp4`;
    const outPath = path.join(recordingsDir, filename);
    this.videoRelPath = `uploads/recordings/${filename}`;

    this.videoProc = spawn(config.ffmpegPath, [
      '-y',
      '-f', 'mjpeg',
      '-framerate', String(LIVE_RECORDING_VIDEO_FPS),
      '-i', 'pipe:0',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-r', String(LIVE_RECORDING_VIDEO_FPS),
      '-movflags', '+faststart',
      outPath,
    ]);
    this.videoProc.stderr?.on('data', () => {});
    this.videoProc.on('error', (e) =>
      console.error(`[REC] Erro FFmpeg vídeo: ${e.message}`),
    );
  }

  // ── Escrever chunks ────────────────────────────────────────────────────────

  writeAudio(chunk: Buffer): void {
    const stdin = this.audioProc?.stdin;
    if (!stdin || stdin.destroyed) return;
    if (stdin.writableLength > 512 * 1024) return;
    stdin.write(chunk);
  }

  writeVideo(chunk: Buffer): void {
    const stdin = this.videoProc?.stdin;
    if (!stdin || stdin.destroyed) return;
    if (stdin.writableLength > 1024 * 1024) return;
    stdin.write(chunk);
  }

  // ── Terminar e guardar ────────────────────────────────────────────────────

  stop(): Promise<void> {
    return new Promise((resolve) => {
      let pending = 0;
      const done = () => {
        if (--pending === 0) {
          this.saveRecord();
          resolve();
        }
      };

      if (this.audioProc) {
        pending++;
        this.audioProc.stdin?.end();
        this.audioProc.once('close', done);
      }
      if (this.videoProc) {
        pending++;
        this.videoProc.stdin?.end();
        this.videoProc.once('close', done);
      }
      if (pending === 0) {
        this.saveRecord();
        resolve();
      }
    });
  }

  private saveRecord(): void {
    const endedAt = new Date();
    const durationSeconds = Math.round(
      (endedAt.getTime() - this.startedAt.getTime()) / 1000,
    );

    completed.set(this.sessionId, {
      id: this.sessionId,
      title: this.title,
      mediaType: this.mediaType,
      audioFile: this.audioRelPath,
      videoFile: this.videoRelPath,
      startedAt: this.startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds,
    });

    console.info(
      `[REC] "${this.title}" guardada — ${durationSeconds}s`,
    );
  }
}
