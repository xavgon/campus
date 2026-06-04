import { BRAND } from '@/shared/styles/brand';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** `icon` = emblema 3D · `full` = wordmark · `mark` = quadrado amarelo */
  variant?: 'icon' | 'full' | 'mark';
  className?: string;
}

const fullHeights = {
  sm: 'h-10 sm:h-11',
  md: 'h-12 sm:h-14',
  lg: 'h-16 sm:h-20',
} as const;

const iconHeights = {
  sm: 'h-9 w-9 sm:h-10 sm:w-10',
  md: 'h-11 w-11 sm:h-12 sm:w-12',
  lg: 'h-14 w-14 sm:h-16 sm:w-16',
} as const;

const markHeights = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
} as const;

const logoSrc = {
  icon: BRAND.logoEmblem,
  full: BRAND.logo,
  mark: BRAND.logoMark,
} as const;

export const Logo = ({ size = 'md', variant = 'icon', className = '' }: LogoProps) => {
  const src = logoSrc[variant];
  const isFull = variant === 'full';
  const isMark = variant === 'mark';
  const sizeClass = isFull ? fullHeights[size] : isMark ? markHeights[size] : iconHeights[size];

  return (
    <img
      src={src}
      alt={variant === 'full' ? BRAND.logoAlt : ''}
      aria-hidden={variant !== 'full' ? true : undefined}
      className={`max-w-full object-contain object-left rounded-none ${
        isFull ? `w-auto ${sizeClass}` : sizeClass
      } ${className}`.trim()}
      width={isFull ? 220 : isMark ? 36 : 44}
      height={isFull ? 80 : isMark ? 36 : 44}
      decoding="async"
      fetchPriority="high"
    />
  );
};
