import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthPanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerHref: string;
  footerLabel: string;
}

export const AuthPanel = ({
  title,
  subtitle,
  children,
  footerText,
  footerHref,
  footerLabel,
}: AuthPanelProps) => (
  <div className="campus-panel campus-page-enter w-full max-w-md p-7 sm:p-8">
    <h1 className="text-2xl font-bold tracking-tight text-campus-foreground sm:text-3xl">{title}</h1>
    <p className="mt-2 text-sm leading-relaxed text-campus-accent">{subtitle}</p>
    <div className="mt-7">{children}</div>
    <p className="mt-6 text-center text-sm text-campus-muted">
      {footerText}{' '}
      <Link
        to={footerHref}
        className="font-semibold text-campus-primary underline-offset-4 hover:underline"
      >
        {footerLabel}
      </Link>
    </p>
  </div>
);
