import { createContext } from 'react';
import type { ApiResponse } from '@/shared/types';
import type { AuthPayload, LoginCredentials, RegisterCredentials, User } from '@/features/auth/types/auth.types';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<ApiResponse<AuthPayload>>;
  register: (credentials: RegisterCredentials) => Promise<ApiResponse<AuthPayload>>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  becomeCreator: () => Promise<void>;
  leaveCreator: () => Promise<{ podcasts: number; streams: number }>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
