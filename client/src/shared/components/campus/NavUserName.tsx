import { splitNavDisplayName } from '@/shared/utils/splitNavDisplayName';

interface NavUserNameProps {
  nome: string;
  className?: string;
}

export const NavUserName = ({ nome, className = '' }: NavUserNameProps) => {
  const { lead, trail } = splitNavDisplayName(nome);

  if (!trail) {
    return (
      <span className={`truncate font-semibold text-campus-foreground ${className}`.trim()}>
        {lead}
      </span>
    );
  }

  return (
    <span className={`truncate ${className}`.trim()}>
      <span className="font-medium text-campus-accent">{lead}</span>{' '}
      <span className="font-bold text-campus-primary">{trail}</span>
    </span>
  );
};
