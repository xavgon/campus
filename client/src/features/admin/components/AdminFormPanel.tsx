import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/shared/components/ui/Button';

interface AdminFormPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  submitLabel: string;
  onSubmit: (event: FormEvent) => void;
  isSubmitting?: boolean;
  secondaryAction?: ReactNode;
}

export const AdminFormPanel = ({
  title,
  description,
  children,
  submitLabel,
  onSubmit,
  isSubmitting,
  secondaryAction,
}: AdminFormPanelProps) => (
  <div className="mb-8 rounded-none border border-campus-border/70 bg-black/25 p-5 sm:p-6">
    <header className="mb-5 border-b border-campus-border/50 pb-4">
      <h2 className="text-base font-bold text-campus-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-campus-accent">{description}</p>}
    </header>
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      {children}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'A guardar…' : submitLabel}
        </Button>
        {secondaryAction}
      </div>
    </form>
  </div>
);
