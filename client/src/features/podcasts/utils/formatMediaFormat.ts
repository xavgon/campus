const FORMAT_LABELS: Record<string, string> = {
  mp3: 'MP3',
  aac: 'AAC (M4A)',
  m4a: 'AAC (M4A)',
  ogg: 'OGG Vorbis',
  wav: 'WAV',
  mp4: 'MP4',
  webm: 'WebM',
  mov: 'QuickTime',
};

export const formatMediaFormatLabel = (format?: string | null): string => {
  if (!format) return '—';
  return FORMAT_LABELS[format.toLowerCase()] ?? format.toUpperCase();
};
