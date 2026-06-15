import { SERVER_URL } from '@/shared/api/client';
import { getInitials } from '@/features/profile/utils/formatMemberSince';

interface ProfileAvatarProps {
  nome: string;
  fotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-9 w-9 text-xs border',
  md: 'h-20 w-20 text-xl',
  lg: 'h-28 w-28 text-3xl sm:h-32 sm:w-32',
} as const;

const borderClasses = {
  sm: 'border-campus-primary/40 shadow-md shadow-black/40',
  md: 'border-2 border-campus-primary/40 shadow-lg shadow-black/50',
  lg: 'border-2 border-campus-primary/50 shadow-lg shadow-black/50',
} as const;

export const ProfileAvatar = ({ nome, fotoUrl, size = 'lg' }: ProfileAvatarProps) => {
  const sizeClass = sizeClasses[size];
  const borderClass = borderClasses[size];

  if (fotoUrl) {
    const src = fotoUrl.startsWith('http') ? fotoUrl : `${SERVER_URL}/${fotoUrl}`;
    return (
      <img
        src={src}
        alt=""
        className={`${sizeClass} ${borderClass} rounded-none object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${borderClass} flex items-center justify-center rounded-none bg-gradient-to-br from-campus-primary/25 to-campus-surface-elevated font-bold text-campus-primary`}
      aria-hidden
    >
      {getInitials(nome)}
    </div>
  );
};
