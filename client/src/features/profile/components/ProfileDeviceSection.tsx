import { useEffect, useState } from 'react';
import { fetchAccessInfo } from '@/features/auth/services/auth.service';
import type { DeviceAccess } from '@/features/auth/types/auth.types';
import { ProfileSection } from '@/features/profile/components/ProfileSection';
import { getApiErrorMessage } from '@/shared/api/client';
import { Alert } from '@/shared/components/campus/Alert';

const truncateFingerprint = (value: string): string => {
  if (value.length <= 24) return value;
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
};

export const ProfileDeviceSection = () => {
  const [deviceAccess, setDeviceAccess] = useState<DeviceAccess | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetchAccessInfo();
        setDeviceAccess(response.data.deviceAccess);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    })();
  }, []);

  const modeLabel =
    deviceAccess?.mode === 'certificate'
      ? 'Certificado de dispositivo (mTLS)'
      : deviceAccess?.mode === 'allowlist'
        ? 'Excepção allowlist (desenvolvimento)'
        : '—';

  return (
    <ProfileSection
      title="Dispositivo autorizado"
      description="Camada 1 de acesso — identifica a máquina ligada à CA-CAMPUS (Task 2)."
    >
      {error && <Alert title="Dispositivo" message={error} className="mb-4" />}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-campus-muted">Modo de acesso</dt>
          <dd className="mt-1 font-medium text-campus-foreground">{modeLabel}</dd>
        </div>
        <div>
          <dt className="text-campus-muted">Certificado (CN)</dt>
          <dd className="mt-1 font-medium text-campus-foreground">
            {deviceAccess?.cn ?? 'Não apresentado'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-campus-muted">Fingerprint SHA-256</dt>
          <dd className="mt-1 break-all font-mono text-xs text-campus-accent">
            {deviceAccess?.fingerprint ? truncateFingerprint(deviceAccess.fingerprint) : '—'}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-campus-muted">
        A camada 2 (utilizador) é o JWT obtido no login. Ambas as camadas são necessárias para
        acções autenticadas.
      </p>
    </ProfileSection>
  );
};
