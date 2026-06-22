import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

/** Extrai faixa de áudio de um vídeo (ex.: WebM live) para ficheiro WAV temporário. */
export const extractAudioFromVideo = (videoPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(videoPath)) {
      reject(new Error(`Vídeo não encontrado: ${videoPath}`));
      return;
    }

    const audioDir = path.join(path.dirname(videoPath), '..', 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const baseName = path.basename(videoPath, path.extname(videoPath));
    const outputPath = path.join(audioDir, `${baseName}-extracted.wav`);

    const args = ['-y', '-i', videoPath, '-vn', '-ar', '44100', '-ac', '1', outputPath];
    const proc = spawn(config.ffmpegPath, args);

    let stderr = '';
    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg extract falhou (código ${code}): ${stderr.slice(-300)}`));
        return;
      }
      if (!fs.existsSync(outputPath)) {
        reject(new Error('Áudio extraído não foi criado'));
        return;
      }
      resolve(outputPath);
    });

    proc.on('error', (err) => {
      reject(new Error(`Erro ao iniciar FFmpeg: ${err.message}`));
    });
  });
};
