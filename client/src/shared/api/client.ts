import axios from 'axios';
import type { ApiResponse } from '@/shared/types';
import { dispatchApiEvent } from '@/shared/api/apiEvents';
import { isPublicAuthUrl } from '@/shared/api/apiErrors';
import { IS_ELECTRON } from '@/shared/utils/isElectron';
import { clearToken, getToken } from '@/shared/utils/storage';

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

const resolveApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;

  if (import.meta.env.DEV) {
    return fromEnv ?? '/api';
  }

  if (IS_ELECTRON) {
    if (fromEnv && isAbsoluteUrl(fromEnv)) return fromEnv;
    return 'https://localhost:3001/api';
  }

  return fromEnv ?? 'http://localhost:3001/api';
};

const API_BASE_URL = resolveApiBaseUrl();

/** Origem para ficheiros estáticos (/uploads). Em dev com proxy, fica vazio (URLs relativas). */
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.DEV ? '' : API_BASE_URL.replace(/\/api$/, ''));

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const requestUrl = error.config?.url ?? '';
      const hadToken = !!getToken();

      if (status === 401 && hadToken && !isPublicAuthUrl(requestUrl)) {
        clearToken();
        dispatchApiEvent('session-expired');
      } else if (status === 401 && hadToken) {
        clearToken();
      }
    }

    return Promise.reject(error);
  },
);

export const fetchHealth = async () => {
  const { data } = await api.get<
    ApiResponse<{ service: string; status: string; database?: string; timestamp: string }>
  >('/health');
  return data;
};

export interface ApiIndexData {
  name: string;
  version: string;
  description: string;
  baseUrl: string;
  protocol: string;
  envelope: {
    success: { success: true; message: string; data: string };
    error: { success: false; message: string; data: null };
  };
  authentication: {
    type: string;
    header: string;
    streamQuery: string;
  };
  resources: Array<{
    group: string;
    basePath: string;
    endpoints: Array<{
      method: string;
      path: string;
      auth: boolean | string;
      description: string;
    }>;
  }>;
  websocket: {
    path: string;
    query: string;
    description: string;
  };
}

/** RF14 — Metadados e recursos da API REST. */
export const fetchApiIndex = async () => {
  const { data } = await api.get<ApiResponse<ApiIndexData>>('');
  return data;
};

export { getApiErrorMessage, showApiErrorToast, showApiToast } from '@/shared/api/apiErrors';
export { humanizeServerMessage, ERROR_TITLES } from '@/shared/copy/campusMessages';
