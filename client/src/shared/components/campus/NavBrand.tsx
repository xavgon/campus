import { Link } from 'react-router-dom';
import { BRAND } from '@/shared/styles/brand';

interface NavBrandProps {
  size?: 'sm' | 'md';
}

const emblemSizes = {
  sm: 'h-[8.25rem] w-[8.25rem] sm:h-[9rem] sm:w-[9rem]',
  md: 'h-[8.75rem] w-[8.75rem] sm:h-[9.5rem] sm:w-[9.5rem]',
} as const;

const textOffset = {
  sm: 'pl-[6.75rem] sm:pl-[7.5rem]',
  md: 'pl-[7.25rem] sm:pl-[8rem]',
} as const;

const wordSizes = {
  sm: 'text-base sm:text-lg',
  md: 'text-lg sm:text-xl',
} as const;

/** Marca na barra superior — emblema + wordmark CAMPUS à direita */
export const NavBrand = ({ size = 'sm' }: NavBrandProps) => (
  <Link
    to="/"
    className={`relative z-40 inline-flex h-10 shrink-0 items-center overflow-visible rounded-none pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-campus-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${textOffset[size]}`}
    aria-label={`${BRAND.name} — Início`}
  >
    <img
      src={BRAND.logoEmblem}
      alt=""
      width={152}
      height={152}
      className={`pointer-events-none absolute left-0 top-full max-w-none -translate-y-[46%] object-contain object-left ${emblemSizes[size]}`}
      decoding="async"
    />
    <span className={`relative z-10 whitespace-nowrap font-bold tracking-wide ${wordSizes[size]}`}>
      <span className="text-campus-primary">CA</span>
      <span className="text-campus-accent">MPUS</span>
    </span>
  </Link>
);
