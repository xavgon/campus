import {
  LIVE_VIDEO_HEIGHT,
  LIVE_VIDEO_WIDTH,
} from '@/features/live/constants';

/**
 * Desenha só o frame mais recente — descarta frames atrasados para evitar "congelar".
 */
export class LiveVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private latestFrame: ArrayBuffer | null = null;
  private painting = false;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D não suportado');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    this.ctx = ctx;
  }

  pushFrame(buffer: ArrayBuffer): void {
    if (this.disposed) return;
    this.latestFrame = buffer;
    void this.flush();
  }

  private async flush(): Promise<void> {
    if (this.painting || this.disposed) return;
    this.painting = true;

    while (this.latestFrame && !this.disposed) {
      const frame = this.latestFrame;
      this.latestFrame = null;

      try {
        const bitmap = await createImageBitmap(new Blob([frame], { type: 'image/jpeg' }));
        if (!this.disposed) {
          const scale = Math.min(
            this.canvas.width / bitmap.width,
            this.canvas.height / bitmap.height,
          );
          const drawW = bitmap.width * scale;
          const drawH = bitmap.height * scale;
          const offsetX = (this.canvas.width - drawW) / 2;
          const offsetY = (this.canvas.height - drawH) / 2;
          this.ctx.fillStyle = '#000000';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(bitmap, offsetX, offsetY, drawW, drawH);
        }
        bitmap.close();
      } catch {
        // frame corrupto — ignorar
      }
    }

    this.painting = false;
    if (this.latestFrame && !this.disposed) {
      void this.flush();
    }
  }

  dispose(): void {
    this.disposed = true;
    this.latestFrame = null;
  }
}

export const createLiveVideoRenderer = (
  canvas: HTMLCanvasElement | null,
): LiveVideoRenderer | null => {
  if (!canvas) return null;
  if (canvas.width !== LIVE_VIDEO_WIDTH) canvas.width = LIVE_VIDEO_WIDTH;
  if (canvas.height !== LIVE_VIDEO_HEIGHT) canvas.height = LIVE_VIDEO_HEIGHT;
  return new LiveVideoRenderer(canvas);
};
