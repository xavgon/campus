import axios from 'axios';
import type { ApiResponse } from '@/shared/types';
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
    if (error.response?.status === 401) {
      clearToken();
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

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Não foi possível ligar à API. Confirma que o servidor está a correr (cd server && npm run dev). Em dev usa VITE_API_URL=/api; com HTTPS directo usa https://localhost:3001/api.';
    }
    if (error.response.data?.message) {
      return String(error.response.data.message);
    }
  }
  return 'Ocorreu um erro. Tente novamente.';
};
