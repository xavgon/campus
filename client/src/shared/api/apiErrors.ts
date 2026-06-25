import axios from 'axios';
import { IS_ELECTRON } from '@/shared/utils/isElectron';
import {
  API_COPY,
  humanizeServerMessage,
  httpStatusMessage,
} from '@/shared/copy/campusMessages';
import { dispatchApiEvent, type ApiToastPayload } from '@/shared/api/apiEvents';

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const;

export const isPublicAuthUrl = (url: string): boolean => {
  const path = url.split('?')[0] ?? url;
  return PUBLIC_AUTH_PATHS.some((segment) => path.includes(segment));
};

const networkErrorMessage = (): string => {
  if (IS_ELECTRON) return API_COPY.networkElectron;
  if (import.meta.env.DEV) return API_COPY.networkDev;
  return API_COPY.networkProd;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') return API_COPY.timeout;
      return networkErrorMessage();
    }

    const data = error.response.data as { message?: unknown } | undefined;
    if (typeof data?.message === 'string' && data.message.trim()) {
      return humanizeServerMessage(data.message);
    }

    const fallback = httpStatusMessage(error.response.status);
    if (fallback) return fallback;
  }

  if (error instanceof Error && error.message.trim()) {
    return humanizeServerMessage(error.message);
  }

  return API_COPY.generic;
};

export const showApiErrorToast = (
  error: unknown,
  title = API_COPY.toastDefaultTitle,
): void => {
  dispatchApiEvent('toast', {
    variant: 'error',
    title,
    message: getApiErrorMessage(error),
  });
};

export const showApiToast = (payload: ApiToastPayload): void => {
  dispatchApiEvent('toast', payload);
};
