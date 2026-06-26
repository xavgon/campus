import type { UserRole } from '@/features/auth/types/auth.types';

const roleStyles: Record<UserRole, string> = {
  admin: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
  creator: 'border-campus-primary/40 bg-campus-primary/10 text-campus-primary',
  user: 'border-campus-border/60 bg-black/20 text-campus-muted',
};

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  creator: 'Criador',
  user: 'Utilizador',
};

interface RoleBadgeProps {
  role: UserRole;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => (
  <span
    className={`inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleStyles[role]}`}
  >
    {roleLabels[role]}
  </span>
);
