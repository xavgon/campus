import type { InputHTMLAttributes, ReactNode } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Field = ({
  label,
  error,
  hint,
  icon,
  iconRight,
  id,
  className = '',
  ...props
}: FieldProps) => {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-campus-foreground">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-campus-muted">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`w-full rounded-none border bg-campus-surface-elevated py-3 text-sm text-campus-foreground outline-none transition placeholder:text-campus-muted focus:ring-2 focus:ring-campus-primary/30 ${
            error
              ? 'border-campus-danger/70 focus:border-campus-danger'
              : 'border-campus-border focus:border-campus-primary'
          } ${icon ? 'pl-11' : 'pl-4'} ${iconRight ? 'pr-11' : 'pr-4'} ${className}`}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{iconRight}</div>
        )}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-campus-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-campus-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
