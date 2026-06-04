import type {
  AuthPayload,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '@/features/auth/types/auth.types';
import { api } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';

export const register = async (credentials: RegisterCredentials) => {
  const { data } = await api.post<ApiResponse<AuthPayload>>('/auth/register', credentials);
  return data;
};

export const login = async (credentials: LoginCredentials) => {
  const { data } = await api.post<ApiResponse<AuthPayload>>('/auth/login', credentials);
  return data;
};

export const fetchProfile = async () => {
  const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/profile');
  return data;
};

export const requestPasswordReset = async (email: string) => {
  const { data } = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
  return data;
};
