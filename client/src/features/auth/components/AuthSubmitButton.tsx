import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { SpinnerIcon } from '@/features/auth/components/icons';
import { Button } from '@/shared/components/ui/Button';

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
}

export const AuthSubmitButton = ({
  children,
  loading = false,
  loadingLabel,
  disabled,
  className = '',
  ...props
}: AuthSubmitButtonProps) => (
  <Button
    type="submit"
    variant="primary"
    fullWidth
    disabled={disabled || loading}
    className={className}
    {...props}
  >
    {loading ? (
      <>
        <SpinnerIcon />
        <span>{loadingLabel ?? children}</span>
      </>
    ) : (
      children
    )}
  </Button>
);
