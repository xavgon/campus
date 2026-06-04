import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageHeader } from '@/features/admin/components/AdminPageHeader';
import { AdminStatCard } from '@/features/admin/components/AdminStatCard';
import { ADMIN_NAV_ITEMS } from '@/features/admin/constants';
import { fetchAdminOverview } from '@/features/admin/services/admin.service';
import type { AdminOverview } from '@/features/admin/types/admin.types';
import { getApiErrorMessage } from '@/shared/api/client';

export const AdminOverviewPage = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAdminOverview()
      .then(setOverview)
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  return (
    <section className="campus-panel p-5 sm:p-7">
      <AdminPageHeader
        eyebrow="Painel"
        title="Gestão da plataforma"
        description="Visão geral de utilizadores, publicações, transmissões e actividade em tempo real."
      />

      {error && (
        <p className="mb-4 rounded-none border border-campus-danger/40 bg-campus-danger/10 px-4 py-3 text-sm text-campus-danger">
          {error}
        </p>
      )}

      {overview && (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <AdminStatCard label="Utilizadores" value={overview.usersCount} accent />
          <AdminStatCard label="Publicações" value={overview.podcastsCount} />
          <AdminStatCard label="Transmissões" value={overview.streamsCount} />
          <AdminStatCard label="Ligados agora" value={overview.onlineCount} hint="Últimos 90 s" />
          <AdminStatCard label="Em direto" value={overview.liveStreams} />
        </div>
      )}

      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-campus-muted">
        Gestão completa
      </h2>
      <p className="mb-4 text-sm text-campus-accent">
        Em cada secção podes criar, editar e eliminar registos. As acções ficam registadas em{' '}
        <Link to="/admin/logs" className="font-bold text-campus-primary hover:underline">
          Registo
        </Link>
        .
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ADMIN_NAV_ITEMS.filter((item) => item.to !== '/admin').map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="block rounded-none border border-campus-border/70 bg-black/20 p-4 transition hover:border-campus-primary/40"
          >
            <p className="font-bold text-campus-foreground">{item.label}</p>
            <p className="mt-1 text-sm text-campus-accent">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
