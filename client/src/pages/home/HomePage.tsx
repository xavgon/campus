import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchHealth } from '@/shared/api/client';
import { FeatureList } from '@/shared/components/campus/FeatureList';
import { Button } from '@/shared/components/ui/Button';
import { BRAND } from '@/shared/styles/brand';

export const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    fetchHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <div className="campus-panel campus-page-enter w-full max-w-lg p-7 sm:p-9">
      <div className="mb-6 inline-flex items-center gap-2 rounded-none border border-campus-primary/30 bg-campus-primary/10 px-3 py-1 text-xs font-semibold text-campus-primary">
        <span
          className={`h-2 w-2 rounded-none ${
            apiStatus === 'online'
              ? 'bg-campus-primary shadow-[0_0_8px_#f5c518]'
              : apiStatus === 'offline'
                ? 'bg-campus-danger'
                : 'animate-pulse bg-campus-muted'
          }`}
        />
        {apiStatus === 'loading'
          ? 'A ligar ao servidor…'
          : apiStatus === 'online'
            ? 'Plataforma disponível'
            : 'Servidor offline'}
      </div>

      <h1 className="text-3xl font-bold leading-tight text-campus-foreground sm:text-4xl">
        {BRAND.name}
      </h1>
      <p className="mt-3 text-lg font-medium text-campus-primary">{BRAND.tagline}</p>
      <p className="mt-4 text-sm leading-relaxed text-campus-accent">{BRAND.description}</p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {isAuthenticated ? (
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button fullWidth>Abrir dashboard</Button>
          </Link>
        ) : (
          <>
            <Link to="/register" className="w-full sm:flex-1">
              <Button fullWidth>Começar agora</Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" fullWidth>
                Já tenho conta
              </Button>
            </Link>
          </>
        )}
      </div>

      <div className="mt-8 border-t border-campus-border pt-6 lg:hidden">
        <FeatureList />
      </div>
    </div>
  );
};
