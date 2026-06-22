import { Link } from 'react-router-dom';
import type { User } from '@/features/auth/types/auth.types';
import { canPublishPodcasts } from '@/features/auth/utils/canPublish';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { formatMemberSince } from '@/features/profile/utils/formatMemberSince';
import { BRAND } from '@/shared/styles/brand';
import { Button } from '@/shared/components/ui/Button';

interface DashboardWelcomeProps {
  user: User;
}

export const DashboardWelcome = ({ user }: DashboardWelcomeProps) => {
  const memberSince = formatMemberSince(user.created_at);
  const firstName = user.nome.trim().split(/\s+/)[0] ?? user.nome;
  const canPublish = canPublishPodcasts(user);

  return (
    <div className="campus-panel flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <ProfileAvatar nome={user.nome} fotoUrl={user.foto_perfil} size="md" />
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-campus-primary">
            Área pessoal
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-campus-foreground sm:text-3xl">
            Olá, {firstName}
          </h1>
          <p className="mt-2 text-sm text-campus-accent">{user.email}</p>
          <p className="mt-1 text-xs text-campus-muted">Membro desde {memberSince}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
        {canPublish && (
          <Link to="/podcasts/new" className="w-full sm:w-auto">
            <Button className="w-full">Publicar episódio</Button>
          </Link>
        )}
        <Link to="/podcasts" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full">
            Ver biblioteca
          </Button>
        </Link>
      </div>

      <p className="sr-only">
        {BRAND.tagline}
      </p>
    </div>
  );
};
