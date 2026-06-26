import type { Podcast } from '@/features/podcasts/types/podcast';

export const canDownloadPodcast = (
  podcast: Podcast,
  media: 'audio' | 'video' = 'audio',
): boolean => {
  if (podcast.status !== 'published' || podcast.compressedSize == null) return false;
  return media === 'video' ? Boolean(podcast.videoUrl) : Boolean(podcast.audioUrl);
};

const parseContentDispositionFilename = (header: string | undefined): string | null => {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
};

const defaultDownloadName = (podcast: Podcast, media: 'audio' | 'video'): string => {
  const url = media === 'video' ? podcast.videoUrl : podcast.audioUrl;
  const ext = url?.match(/\.[a-z0-9]+$/i)?.[0] ?? (media === 'video' ? '.mp4' : '.mp3');
  const safeTitle =
    podcast.title
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\w.-]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'podcast';
  return `${safeTitle}${ext}`;
};

export const triggerBrowserDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const resolveDownloadFilename = (
  podcast: Podcast,
  media: 'audio' | 'video',
  contentDisposition?: string,
): string => parseContentDispositionFilename(contentDisposition) ?? defaultDownloadName(podcast, media);
