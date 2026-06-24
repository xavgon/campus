export interface CompressionProgress {
  audio: number | null;
  video: number | null;
  overall: number;
  active: boolean;
}
