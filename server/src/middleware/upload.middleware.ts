import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { config } from '../config';
import { AppError } from './errorHandler';

// ─── Garantir que as pastas existem ──────────────────────────────────────────

const audioDir  = path.join(config.uploadDir, 'audio');
const coversDir = path.join(config.uploadDir, 'covers');
const avatarsDir = path.join(config.uploadDir, 'avatars');
const videoDir  = path.join(config.uploadDir, 'video');

for (const dir of [audioDir, coversDir, avatarsDir, videoDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Tipos permitidos ─────────────────────────────────────────────────────────

const AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',       // mp3
  'audio/wav',        // wav
  'audio/ogg',        // ogg
  'audio/mp4',        // m4a
  'audio/x-m4a',
  'audio/flac',
  'audio/aac',
  'audio/webm',       // gravações live (MediaRecorder)
]);

const VIDEO_MIME_TYPES = new Set([
  'video/webm',
  'video/mp4',
  'video/ogg',
]);

const VIDEO_MIME_TYPES = new Set([
  'video/mp4',        // H.264 / H.265
  'video/webm',       // VP9
  'video/quicktime',  // MOV
  'video/x-matroska', // MKV
]);

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/** Browsers/MediaRecorder enviam codecs no MIME (ex.: video/webm;codecs=vp9,opus). */
const normalizeMime = (mimetype: string, fieldname: string, originalname: string): string => {
  const base = mimetype.split(';')[0]?.trim().toLowerCase();
  if (base && base !== 'application/octet-stream') return base;

  const ext = path.extname(originalname).toLowerCase();
  if (ext === '.webm') return fieldname === 'audio' ? 'audio/webm' : 'video/webm';
  if (ext === '.mp4') return fieldname === 'video' ? 'video/mp4' : 'audio/mp4';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  return base;
};

const isAudioMime = (mimetype: string): boolean => AUDIO_MIME_TYPES.has(mimetype);
const isVideoMime = (mimetype: string): boolean => VIDEO_MIME_TYPES.has(mimetype);

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination(_req, file, cb) {
    const mime = normalizeMime(file.mimetype, file.fieldname, file.originalname);
    if (isAudioMime(mime)) {
      cb(null, audioDir);
    } else if (VIDEO_MIME_TYPES.has(file.mimetype)) {
      cb(null, videoDir);
    } else {
      cb(null, coversDir);
    }
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, unique);
  },
});

// ─── Filtro de ficheiros ──────────────────────────────────────────────────────

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const mime = normalizeMime(file.mimetype, file.fieldname, file.originalname);

  if (file.fieldname === 'audio' && !isAudioMime(mime)) {
    cb(new AppError('Formato de áudio inválido. Use MP3, WAV, OGG, M4A, FLAC, AAC ou WebM.'));
    return;
  }
  if (file.fieldname === 'video' && !VIDEO_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError('Formato de vídeo inválido. Use MP4, WebM, MOV ou MKV.'));
    return;
  }
  if (file.fieldname === 'cover' && !IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError('Formato de imagem inválido. Use JPG, PNG ou WebP.'));
    return;
  }
  cb(null, true);
};

// ─── Instância multer ─────────────────────────────────────────────────────────

// ─── Avatar (foto de perfil) ──────────────────────────────────────────────────

const avatarStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, avatarsDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, unique);
  },
});

const avatarFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError('Formato de imagem inválido. Use JPG, PNG ou WebP.'));
    return;
  }
  cb(null, true);
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: avatarFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('photo');

// ─── Podcast (áudio + capa) ───────────────────────────────────────────────────

export const uploadPodcast = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
  },
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);

export { VIDEO_MIME_TYPES };
