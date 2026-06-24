import type { Podcast } from '@/features/podcasts/types/podcast';

export type CompressionState = 'pending' | 'processing' | 'complete';

export const getCompressionState = (podcast: Podcast): CompressionState => {
  const hasMedia = Boolean(podcast.audioUrl || podcast.videoUrl);
  if (!hasMedia) return 'pending';
  if (podcast.compressedSize != null) return 'complete';
  return 'processing';
};

const STATE_LABELS: Record<CompressionState, string> = {
  pending: 'Pendente',
  processing: 'A comprimir',
  complete: 'Comprimido',
};

export const compressionStateLabel = (state: CompressionState): string => STATE_LABELS[state];

export const compressionStateHint = (state: CompressionState, hasVideo: boolean): string => {
  switch (state) {
    case 'pending':
      return 'Aguarda ficheiro de áudio ou vídeo para iniciar a compressão.';
    case 'processing':
      return hasVideo
        ? 'O FFmpeg está a optimizar o vídeo e o áudio. Podes ouvir/ver a versão original.'
        : 'O FFmpeg está a optimizar o áudio. Podes ouvir a versão original enquanto esperas.';
    case 'complete':
      return 'Versão optimizada disponível para streaming e download.';
  }
};
