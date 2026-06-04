import axios from 'axios';
import type { ApiResponse } from '@/shared/types';
import { clearToken, getToken } from '@/shared/utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

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
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message);
  }
  return 'Ocorreu um erro. Tente novamente.';
};
