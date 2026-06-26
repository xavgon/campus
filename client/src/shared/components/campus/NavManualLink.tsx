import { Link, useLocation } from 'react-router-dom';
import { BookIcon } from '@/shared/components/ui/icons';
import { USER_MANUAL_TO } from '@/shared/navigation/navConfig';

interface NavManualLinkProps {
  className?: string;
  showLabel?: boolean;
  /** Mostra o texto em qualquer largura (ex.: rodapé da sidebar). */
  alwaysShowLabel?: boolean;
}

export const NavManualLink = ({
  className = '',
  showLabel = true,
  alwaysShowLabel = false,
}: NavManualLinkProps) => {
  const { pathname } = useLocation();
  const active =
    pathname === USER_MANUAL_TO || pathname.startsWith(`${USER_MANUAL_TO}/`);

  return (
    <Link
      to={USER_MANUAL_TO}
      className={`inline-flex items-center gap-1.5 rounded-none border px-2.5 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:px-3 ${
        active
          ? 'border-campus-primary/60 bg-campus-primary/10 text-campus-primary'
          : 'border-campus-border/80 bg-black/35 text-campus-foreground hover:border-campus-primary/55 hover:bg-campus-primary/10 hover:text-campus-primary'
      } ${className}`}
      aria-current={active ? 'page' : undefined}
      aria-label="Manual de utilizador"
      title="Manual"
    >
      <BookIcon size={16} />
      {showLabel ? (
        <span className={alwaysShowLabel ? 'inline' : 'hidden sm:inline'}>Ajuda</span>
      ) : null}
    </Link>
  );
};
