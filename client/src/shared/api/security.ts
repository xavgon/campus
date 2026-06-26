import { api } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/types';

interface HealthSecurity {
  ca: string;
  minTlsVersion: string;
  hsts: boolean;
  mitmProtection: boolean;
}

interface HealthPayload {
  service: string;
  status: string;
  database?: string;
  mtlsStrict?: boolean;
  security?: HealthSecurity;
  timestamp: string;
}

export interface SecurityStatus {
  protocol: string;
  campusCa: string | null;
  hsts: string | null;
  mtlsStrict: boolean;
  minTlsVersion: string | null;
  apiStatus: string | null;
}

export const fetchSecurityStatus = async (): Promise<SecurityStatus> => {
  const response = await api.get<ApiResponse<HealthPayload>>('/health');
  const headers = response.headers as Record<string, string | undefined>;

  return {
    protocol: typeof window !== 'undefined' ? window.location.protocol : 'https:',
    campusCa:
      headers['x-campus-ca'] ??
      response.data.data?.security?.ca ??
      null,
    hsts: headers['strict-transport-security'] ?? null,
    mtlsStrict:
      headers['x-campus-mtls-strict'] === 'true' ||
      response.data.data?.mtlsStrict === true,
    minTlsVersion: response.data.data?.security?.minTlsVersion ?? null,
    apiStatus: response.data.data?.status ?? null,
  };
};
