interface IconProps {
  className?: string;
}

export const PlayIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z" />
  </svg>
);

export const PauseIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 5h3v14H7V5Zm7 0h3v14h-3V5Z" />
  </svg>
);

export const VolumeIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
  </svg>
);

export const VolumeMutedIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M11 5 6 9H3v6h3l5 4V5Z" strokeLinejoin="round" />
    <path d="m16 9 5 6M21 9l-5 6" strokeLinecap="round" />
  </svg>
);

export const FullscreenIcon = ({ className }: IconProps) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M8 3H3v5M16 3h5v5M16 21h5v-5M8 21H3v-5" strokeLinecap="round" />
  </svg>
);
