import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkLabel: string;
}

export const AuthCard = ({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLinkLabel,
}: AuthCardProps) => (
  <div className="mx-auto w-full max-w-md">
    <div className="rounded-none border border-campus-border bg-campus-surface-elevated p-8 shadow-2xl shadow-black/50">
      <h1 className="mb-1 text-2xl font-bold text-campus-primary">{title}</h1>
      <p className="mb-6 text-sm text-campus-muted">{subtitle}</p>
      {children}
    </div>
    <p className="mt-4 text-center text-sm text-campus-muted">
      {footerText}{' '}
      <Link to={footerLink} className="font-semibold text-campus-primary hover:underline">
        {footerLinkLabel}
      </Link>
    </p>
  </div>
);
