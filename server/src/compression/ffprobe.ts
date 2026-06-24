import { spawn } from 'child_process';
import { config } from '../config';

export const getMediaDurationSeconds = (inputPath: string): Promise<number | null> => {
  return new Promise((resolve) => {
    const args = [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      inputPath,
    ];

    const proc = spawn(config.ffprobePath, args);
    let stdout = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.on('close', () => {
      const duration = Number(stdout.trim());
      resolve(Number.isFinite(duration) && duration > 0 ? duration : null);
    });

    proc.on('error', () => resolve(null));
  });
};
