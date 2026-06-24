import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config';
import { ffmpegProgressPercent } from './ffmpegProgress';
import { getMediaDurationSeconds } from './ffprobe';

export interface CompressionResult {
  outputPath: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTimeMs: number;
}

export interface CompressMediaOptions {
  onProgress?: (percent: number) => void;
}

/**
 * Comprime uma imagem (JPEG, PNG ou WebP) usando sharp.
 * Sobrescreve o ficheiro original com a versão comprimida.
 * Suporta conversão entre formatos (ex: PNG → WebP).
 */
export const compressImage = async (inputPath: string): Promise<CompressionResult> => {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Ficheiro não encontrado: ${inputPath}`);
  }

  const startTime = Date.now();
  const originalSize = fs.statSync(inputPath).size;
  const ext = path.extname(inputPath).toLowerCase();

  const tmpPath = inputPath + '.tmp';
  const image = sharp(inputPath);

  if (ext === '.jpg' || ext === '.jpeg') {
    await image.jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(tmpPath);
  } else if (ext === '.png') {
    await image.png({ compressionLevel: 8, palette: true }).toFile(tmpPath);
  } else if (ext === '.webp') {
    await image.webp({ quality: 80 }).toFile(tmpPath);
  } else {
    const outputPath = inputPath.replace(ext, '.webp');
    await image.webp({ quality: 80 }).toFile(outputPath);
    const compressedSize = fs.statSync(outputPath).size;
    const compressionRatio = originalSize > 0
      ? Math.round((1 - compressedSize / originalSize) * 10000) / 100 : 0;
    return { outputPath, originalSize, compressedSize, compressionRatio, processingTimeMs: Date.now() - startTime };
  }

  fs.renameSync(tmpPath, inputPath);

  const compressedSize = fs.statSync(inputPath).size;
  const compressionRatio = originalSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 10000) / 100 : 0;

  return { outputPath: inputPath, originalSize, compressedSize, compressionRatio, processingTimeMs: Date.now() - startTime };
};

/**
 * Comprime um ficheiro de áudio para MP3 128kbps usando FFmpeg.
 * Guarda o resultado em uploads/audio/compressed/.
 * Retorna os tamanhos e rácio de compressão.
 */
// Mapeamento de formato → codec FFmpeg, extensão de saída e argumentos de qualidade
// MP3  → libmp3lame  128kbps mono  — formato padrão de podcasts
// AAC  → aac         128kbps       — nativo iOS/macOS, contentor M4A
// OGG  → libvorbis   quality 4     — formato aberto, ~128kbps
// WAV / outros → MP3 (grande redução de tamanho)
type AudioFormat = 'mp3' | 'aac' | 'ogg';

const AUDIO_FORMAT_MAP: Record<string, AudioFormat> = {
  '.mp3': 'mp3',
  '.aac': 'aac',
  '.m4a': 'aac',
  '.ogg': 'ogg',
};

const AUDIO_CODEC_ARGS: Record<AudioFormat, { args: string[]; ext: string }> = {
  mp3: { args: ['-vn', '-ar', '44100', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '128k'], ext: '.mp3' },
  aac: { args: ['-vn', '-ar', '44100', '-codec:a', 'aac', '-b:a', '128k'],                   ext: '.m4a' },
  ogg: { args: ['-vn', '-ar', '44100', '-codec:a', 'libvorbis', '-q:a', '4'],                ext: '.ogg' },
};

export const compressAudio = async (
  inputPath: string,
  options?: CompressMediaOptions,
): Promise<CompressionResult> => {
  const durationSeconds = await getMediaDurationSeconds(inputPath);

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      reject(new Error(`Ficheiro não encontrado: ${inputPath}`));
      return;
    }

    const startTime = Date.now();
    const originalSize = fs.statSync(inputPath).size;
    const inputExt = path.extname(inputPath).toLowerCase();
    const format: AudioFormat = AUDIO_FORMAT_MAP[inputExt] ?? 'mp3';
    const { args: codecArgs, ext: outputExt } = AUDIO_CODEC_ARGS[format];

    const compressedDir = path.join(path.dirname(inputPath), 'compressed');
    if (!fs.existsSync(compressedDir)) {
      fs.mkdirSync(compressedDir, { recursive: true });
    }

    const baseName = path.basename(inputPath, inputExt);
    const outputPath = path.join(compressedDir, `${baseName}${outputExt}`);

    const args = ['-y', '-i', inputPath, ...codecArgs, '-map_metadata', '0', outputPath];
    const proc = spawn(config.ffmpegPath, args);

    let stderr = '';
    proc.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      if (durationSeconds && options?.onProgress) {
        const percent = ffmpegProgressPercent(chunk, durationSeconds);
        if (percent != null) options.onProgress(percent);
      }
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
        ? Math.round((1 - compressedSize / originalSize) * 10000) / 100 : 0;
      resolve({ outputPath, originalSize, compressedSize, compressionRatio, processingTimeMs: Date.now() - startTime });
    });

    proc.on('error', (err) => {
      reject(new Error(`Erro ao iniciar FFmpeg: ${err.message}. Verifica FFMPEG_PATH no .env`));
    });
  });
};

export type VideoCodec = 'h264' | 'h265' | 'vp9';

/**
 * Comprime um ficheiro de vídeo usando FFmpeg.
 * Suporta três codecs: H.264 (libx264), H.265 (libx265), VP9 (libvpx-vp9).
 * Guarda o resultado em uploads/video/compressed/.
 */
export const compressVideo = async (
  inputPath: string,
  codec: VideoCodec = 'h264',
  options?: CompressMediaOptions,
): Promise<CompressionResult> => {
  const durationSeconds = await getMediaDurationSeconds(inputPath);

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputPath)) {
      reject(new Error(`Ficheiro não encontrado: ${inputPath}`));
      return;
    }

    const startTime = Date.now();
    const originalSize = fs.statSync(inputPath).size;

    const compressedDir = path.join(path.dirname(inputPath), 'compressed');
    if (!fs.existsSync(compressedDir)) {
      fs.mkdirSync(compressedDir, { recursive: true });
    }

    const baseName = path.basename(inputPath, path.extname(inputPath));

    // VP9 usa WebM como contentor; H.264 e H.265 usam MP4
    const ext = codec === 'vp9' ? '.webm' : '.mp4';
    const outputPath = path.join(compressedDir, `${baseName}_${codec}${ext}`);

    // Mapeamento codec → encoder FFmpeg e opções
    // H.264  → libx264  | CRF 23 (boa qualidade, ficheiro menor)
    // H.265  → libx265  | CRF 28 (melhor compressão que H.264)
    // VP9    → libvpx-vp9| CRF 33, bitrate 0 (modo qualidade constante)
    const codecArgs: Record<VideoCodec, string[]> = {
      h264: ['-c:v', 'libx264',    '-crf', '23', '-preset', 'fast', '-c:a', 'aac',    '-b:a', '128k'],
      h265: ['-c:v', 'libx265',    '-crf', '28', '-preset', 'fast', '-c:a', 'aac',    '-b:a', '128k'],
      vp9:  ['-c:v', 'libvpx-vp9', '-crf', '33', '-b:v',    '0',   '-c:a', 'libopus', '-b:a', '128k'],
    };

    const args = [
      '-y',
      '-i', inputPath,
      ...codecArgs[codec],
      '-movflags', '+faststart', // permite streaming antes do download completo
      outputPath,
    ];

    const proc = spawn(config.ffmpegPath, args);

    let stderr = '';
    proc.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      if (durationSeconds && options?.onProgress) {
        const percent = ffmpegProgressPercent(chunk, durationSeconds);
        if (percent != null) options.onProgress(percent);
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg (${codec}) falhou (código ${code}): ${stderr.slice(-300)}`));
        return;
      }

      if (!fs.existsSync(outputPath)) {
        reject(new Error('FFmpeg terminou mas o ficheiro de saída não foi criado'));
        return;
      }

      const compressedSize = fs.statSync(outputPath).size;
      const compressionRatio = originalSize > 0
        ? Math.round((1 - compressedSize / originalSize) * 10000) / 100 : 0;
      resolve({ outputPath, originalSize, compressedSize, compressionRatio, processingTimeMs: Date.now() - startTime });
    });

    proc.on('error', (err) => {
      reject(new Error(`Erro ao iniciar FFmpeg: ${err.message}. Verifica FFMPEG_PATH no .env`));
    });
  });
};
