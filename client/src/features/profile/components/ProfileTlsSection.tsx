import { useEffect, useState } from 'react';
import { fetchSecurityStatus } from '@/shared/api/security';
import { ProfileSection } from '@/features/profile/components/ProfileSection';
import { Alert } from '@/shared/components/campus/Alert';
import { getApiErrorMessage } from '@/shared/api/client';
import { IS_ELECTRON } from '@/shared/utils/isElectron';

interface SecuritySnapshot {
  protocol: string;
  campusCa: string | null;
  hsts: string | null;
  mtlsStrict: boolean;
  minTlsVersion: string | null;
  apiStatus: string | null;
}

export const ProfileTlsSection = () => {
  const [snapshot, setSnapshot] = useState<SecuritySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const status = await fetchSecurityStatus();
        setSnapshot(status);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    })();
  }, []);

  const httpsActive = snapshot?.protocol === 'https:' || snapshot?.protocol === 'https';
  const hstsActive = Boolean(snapshot?.hsts);

  return (
    <ProfileSection
      title="Ligação segura (anti-MITM)"
      description="Task 7 — TLS com CA-CAMPUS e HSTS impedem interceptação Man-in-the-Middle."
    >
      {error && <Alert title="Ligação segura" message={error} className="mb-4" />}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-campus-muted">Protocolo actual</dt>
          <dd className="mt-1 font-medium text-campus-foreground">
            {httpsActive ? 'HTTPS' : snapshot?.protocol ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-campus-muted">CA de confiança</dt>
          <dd className="mt-1 font-medium text-campus-foreground">
            {snapshot?.campusCa ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-campus-muted">HSTS activo</dt>
          <dd className="mt-1 font-medium text-campus-foreground">
            {hstsActive ? 'Sim' : snapshot ? 'Não detectado' : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-campus-muted">TLS mínimo (API)</dt>
          <dd className="mt-1 font-medium text-campus-foreground">
            {snapshot?.minTlsVersion ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-campus-muted">mTLS estrito</dt>
          <dd className="mt-1 font-medium text-campus-foreground">
            {snapshot?.mtlsStrict ? 'Activado' : 'Permissivo (dev)'}
          </dd>
        </div>
        <div>
          <dt className="text-campus-muted">Cliente</dt>
          <dd className="mt-1 font-medium text-campus-foreground">
            {IS_ELECTRON ? 'Electron (CA verificada)' : 'Browser / proxy Vite'}
          </dd>
        </div>
      </dl>

      {snapshot?.hsts && (
        <p className="mt-4 break-all font-mono text-[10px] text-campus-muted">
          {snapshot.hsts}
        </p>
      )}

      <p className="mt-4 text-xs text-campus-muted">
        Certificados falsos de um atacante MITM falham no handshake TLS. Em produção nunca uses
        <code className="mx-1">rejectUnauthorized: false</code> nem <code className="mx-1">-k</code>.
      </p>
    </ProfileSection>
  );
};
