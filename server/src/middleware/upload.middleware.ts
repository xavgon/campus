import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { config } from '../config';
import { AppError } from './errorHandler';

// ─── Garantir que as pastas existem ──────────────────────────────────────────

const audioDir = path.join(config.uploadDir, 'audio');
const coversDir = path.join(config.uploadDir, 'covers');

for (const dir of [audioDir, coversDir]) {
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
]);

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination(_req, file, cb) {
    if (AUDIO_MIME_TYPES.has(file.mimetype)) {
      cb(null, audioDir);
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
  if (file.fieldname === 'audio' && !AUDIO_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError('Formato de áudio inválido. Use MP3, WAV, OGG, M4A, FLAC ou AAC.'));
    return;
  }
  if (file.fieldname === 'cover' && !IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError('Formato de imagem inválido. Use JPG, PNG ou WebP.'));
    return;
  }
  cb(null, true);
};

// ─── Instância multer ─────────────────────────────────────────────────────────

export const uploadPodcast = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
  },
}).fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);
