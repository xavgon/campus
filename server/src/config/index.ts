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

const nodeEnv = process.env.NODE_ENV ?? 'development';

/** Task 1 — Em modo estrito não há excepção automática de localhost (só allowlist admin). */
const mtlsStrict =
  process.env.MTLS_STRICT != null && process.env.MTLS_STRICT !== ''
    ? parseBoolean(process.env.MTLS_STRICT)
    : nodeEnv === 'production';

/** Task 4 — Só aceita certs registados na CA (além de assinatura válida). */
const caRequireRegistration =
  process.env.CA_REQUIRE_REGISTRATION != null && process.env.CA_REQUIRE_REGISTRATION !== ''
    ? parseBoolean(process.env.CA_REQUIRE_REGISTRATION)
    : false;

export const config = {
  nodeEnv,
  mtlsStrict,
  caRequireRegistration,
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
