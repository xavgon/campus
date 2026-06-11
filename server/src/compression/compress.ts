import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export interface CompressionResult {
  outputPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Comprime um ficheiro de áudio para MP3 128kbps usando FFmpeg.
 * Guarda o resultado em uploads/audio/compressed/.
 * Retorna os tamanhos e rácio de compressão.
 */
export const compressAudio = (inputPath: string): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      reject(new Error(`Ficheiro não encontrado: ${inputPath}`));
      return;
    }

    const originalSize = fs.statSync(inputPath).size;

    // Pasta de destino: uploads/audio/compressed/
    const compressedDir = path.join(path.dirname(inputPath), 'compressed');
    if (!fs.existsSync(compressedDir)) {
      fs.mkdirSync(compressedDir, { recursive: true });
    }

    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(compressedDir, `${baseName}.mp3`);

    // FFmpeg: converter para MP3 mono 128kbps
    // -y          → sobrescrever sem confirmação
    // -i          → ficheiro de entrada
    // -vn         → sem vídeo
    // -ar 44100   → sample rate 44.1kHz
    // -ac 1       → mono (reduz tamanho ~50% vs stereo)
    // -b:a 128k   → bitrate 128kbps (boa qualidade para podcasts)
    // -map_metadata 0 → preservar metadados
    const args = [
      '-y',
      '-i', inputPath,
      '-vn',
      '-ar', '44100',
      '-ac', '1',
      '-b:a', '128k',
      '-map_metadata', '0',
      outputPath,
    ];

    const proc = spawn(config.ffmpegPath, args);

    let stderr = '';
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg falhou (código ${code}): ${stderr.slice(-300)}`));
        return;
      }

      if (!fs.existsSync(outputPath)) {
        reject(new Error('FFmpeg terminou mas o ficheiro de saída não foi criado'));
        return;
      }

      const compressedSize = fs.statSync(outputPath).size;
      const compressionRatio = originalSize > 0
        ? Math.round((1 - compressedSize / originalSize) * 10000) / 100
        : 0;

      resolve({ outputPath, originalSize, compressedSize, compressionRatio });
    });

    proc.on('error', (err) => {
      reject(new Error(`Erro ao iniciar FFmpeg: ${err.message}. Verifica FFMPEG_PATH no .env`));
    });
  });
};
