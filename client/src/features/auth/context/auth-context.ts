import { createContext } from 'react';
import type { LoginCredentials, RegisterCredentials, User } from '@/features/auth/types/auth.types';

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
