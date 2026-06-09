import fs from 'fs';
import path from 'path';
import type { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import { findPodcastById } from '../models/podcast.model';

// ─── Mapa de extensão → MIME type ─────────────────────────────────────────────

const AUDIO_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
};

// ─── GET /api/stream/:id ──────────────────────────────────────────────────────

export const streamAudio = async (req: Request, res: Response): Promise<void> => {
  // 1. Buscar podcast na BD
  const podcast = await findPodcastById(req.params.id as string);
  if (!podcast) throw new AppError('Podcast não encontrado', 404);

  // 2. Verificar se tem áudio
  if (!podcast.audio_url) {
    throw new AppError('Este podcast ainda não tem ficheiro de áudio', 404);
  }

  // 3. Resolver caminho físico do ficheiro
  //    audio_url = "/uploads/audio/filename.mp3"
  //    __dirname  = server/src/streaming  → subir 3 níveis para server/
  const filePath = path.join(__dirname, '..', '..', podcast.audio_url);

  if (!fs.existsSync(filePath)) {
    throw new AppError('Ficheiro de áudio não encontrado no servidor', 404);
  }

  // 4. Obter tamanho total e MIME type
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = AUDIO_MIME[ext] ?? 'audio/mpeg';

  // 5. Processar Range header
  const rangeHeader = req.headers.range;

  if (rangeHeader) {
    // ── Resposta parcial 206 ───────────────────────────────────────────────
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // Validar intervalo
    if (start >= fileSize || end >= fileSize || start > end) {
      res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
      return;
    }

    const chunkSize = end - start + 1;

    res.status(206).set({
      'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': String(chunkSize),
      'Content-Type':   contentType,
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);

  } else {
    // ── Resposta completa 200 ──────────────────────────────────────────────
    res.status(200).set({
      'Content-Length': String(fileSize),
      'Content-Type':   contentType,
      'Accept-Ranges':  'bytes',
    });

    fs.createReadStream(filePath).pipe(res);
  }
};
