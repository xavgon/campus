import { truncateFingerprint } from '@/features/podcasts/utils/truncateFingerprint';

interface AuthorCertBadgeProps {
  cn: string | null | undefined;
  fingerprint: string | null | undefined;
  compact?: boolean;
}

export const AuthorCertBadge = ({ cn, fingerprint, compact = false }: AuthorCertBadgeProps) => {
  const verified = Boolean(fingerprint);

  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          verified
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : 'border-campus-border bg-black/30 text-campus-muted'
        }`}
        title={verified ? `Certificado: ${cn ?? '—'}` : 'Publicado antes da validação de autoria'}
      >
        {verified ? 'Autoria certificada' : 'Sem certificado'}
      </span>
    );
  }

  return (
    <div
      className={`rounded-none border p-4 text-sm ${
        verified
          ? 'border-emerald-500/35 bg-emerald-500/5'
          : 'border-campus-border/60 bg-black/20'
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
          verified ? 'text-emerald-300' : 'text-campus-muted'
        }`}
      >
        {verified ? 'Autoria certificada' : 'Autoria não certificada'}
      </p>
      {verified ? (
        <dl className="mt-3 space-y-2 text-xs">
          <div>
            <dt className="text-campus-muted">Dispositivo (CN)</dt>
            <dd className="mt-0.5 font-medium text-campus-foreground">{cn ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-campus-muted">Fingerprint SHA-256</dt>
            <dd className="mt-0.5 break-all font-mono text-[11px] text-campus-accent">
              {truncateFingerprint(fingerprint!)}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-campus-muted">
          Este episódio foi publicado antes da Task 6 ou sem certificado de dispositivo apresentado.
        </p>
      )}
    </div>
  );
};
