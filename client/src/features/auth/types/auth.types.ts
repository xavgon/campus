export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  nome: string;
  email: string;
  foto_perfil: string | null;
  role: UserRole;
  created_at: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  nome: string;
  email: string;
  password: string;
}
