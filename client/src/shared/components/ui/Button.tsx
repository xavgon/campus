import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-campus-primary text-campus-on-primary hover:bg-campus-primary-dark shadow-md shadow-black/50 focus-visible:ring-campus-primary',
  secondary:
    'bg-campus-surface-elevated text-campus-foreground border border-campus-border hover:border-campus-border-strong focus-visible:ring-campus-accent',
  ghost: 'bg-transparent text-campus-primary hover:bg-campus-primary/10 focus-visible:ring-campus-primary',
  outline:
    'border border-campus-border-strong bg-transparent text-campus-foreground hover:border-campus-primary/60 hover:text-campus-primary focus-visible:ring-campus-primary',
};

export const Button = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center gap-2 rounded-none px-5 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-campus-surface disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);
