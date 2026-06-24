import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value == null || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseNumber(process.env.PORT, 3001),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'campus-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  maxFileSizeMb: parseNumber(process.env.MAX_FILE_SIZE_MB, 50),
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  ffmpegPath: process.env.FFMPEG_PATH ?? 'ffmpeg',
  ffprobePath: process.env.FFPROBE_PATH ?? 'ffprobe',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: parseNumber(process.env.SMTP_PORT, 587),
    secure: parseBoolean(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'CAMPUS <noreply@campus.local>',
    get enabled(): boolean {
      return Boolean(this.host);
    },
  },
} as const;
