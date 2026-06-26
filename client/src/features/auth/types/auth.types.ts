export type UserRole = 'user' | 'creator' | 'admin';

export type DeviceAccessMode = 'certificate' | 'allowlist';

export interface DeviceAccess {
  mode: DeviceAccessMode;
  cn: string | null;
  fingerprint: string | null;
}

export interface AccessInfo {
  user: User;
  deviceAccess: DeviceAccess;
  layers: {
    device: DeviceAccessMode;
    user: 'jwt';
  };
}

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
  deviceAccess?: DeviceAccess;
}

export interface UserActivityRow {
  id: number;
  action: string;
  cert_cn: string | null;
  created_at: string;
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
