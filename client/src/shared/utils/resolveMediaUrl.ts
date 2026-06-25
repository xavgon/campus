import { SERVER_URL } from '@/shared/api/client';

/** Converte caminho `/uploads/...` ou `uploads/...` em URL absoluta ou relativa ao cliente. */
export const resolveMediaUrl = (
  mediaPath: string | null | undefined,
  cacheKey?: string | number,
): string | undefined => {
  if (!mediaPath) return undefined;
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return cacheKey != null ? `${mediaPath}${mediaPath.includes('?') ? '&' : '?'}v=${cacheKey}` : mediaPath;
  }

  const normalized = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
  const url = `${SERVER_URL}${normalized}`;
  return cacheKey != null ? `${url}?v=${cacheKey}` : url;
};
