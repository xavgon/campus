import { Link, useLocation } from 'react-router-dom';
import type { User } from '@/features/auth/types/auth.types';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { NavUserName } from '@/shared/components/campus/NavUserName';

interface NavUserMenuProps {
  user: User;
  onLogout: () => void;
}

export const NavUserMenu = ({ user, onLogout }: NavUserMenuProps) => {
  const { pathname } = useLocation();
  const onProfile = pathname === '/profile';

  return (
    <div className="campus-nav-user flex shrink-0 items-center gap-2 sm:gap-2.5">
      <Link
        to="/profile"
        className={`group flex max-w-[11rem] items-center gap-2.5 rounded-none border py-1.5 pl-1.5 pr-3 transition sm:max-w-[13rem] ${
          onProfile
            ? 'border-campus-primary/60 bg-campus-primary/10'
            : 'border-campus-border/80 bg-black/35 hover:border-campus-primary/45 hover:bg-black/50'
        }`}
        aria-current={onProfile ? 'page' : undefined}
      >
        <ProfileAvatar nome={user.nome} fotoUrl={user.foto_perfil} size="sm" />
        <span className="hidden min-w-0 flex-col sm:flex">
          <NavUserName nome={user.nome} className="text-sm leading-tight" />
          <span
            className={`mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
              onProfile ? 'text-campus-primary' : 'text-campus-muted group-hover:text-campus-primary'
            }`}
          >
            Perfil
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={onLogout}
        className="inline-flex items-center gap-1.5 rounded-none border border-campus-border/80 bg-black/35 px-2.5 py-2 text-sm font-bold text-campus-foreground transition hover:border-campus-primary/55 hover:bg-campus-primary/10 hover:text-campus-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-3"
      >
        <svg
          className="h-4 w-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path strokeLinecap="square" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span className="hidden sm:inline">Sair</span>
      </button>
    </div>
  );
};
