import type { ReactNode } from 'react';

interface ProfileSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export const ProfileSection = ({
  title,
  description,
  children,
  className = '',
}: ProfileSectionProps) => (
  <section className={`campus-panel p-6 sm:p-7 ${className}`.trim()}>
    <header className="mb-6 border-b border-campus-border/60 pb-4">
      <h2 className="text-lg font-bold text-campus-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-campus-accent">{description}</p>}
    </header>
    {children}
  </section>
);
