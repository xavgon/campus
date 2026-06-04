import type { TextareaHTMLAttributes } from 'react';

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = ({
  label,
  error,
  hint,
  id,
  className = '',
  rows = 4,
  ...props
}: TextAreaFieldProps) => {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-campus-foreground">
        {label}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`w-full resize-y rounded-none border bg-campus-surface-elevated px-4 py-3 text-sm text-campus-foreground outline-none transition placeholder:text-campus-muted focus:ring-2 focus:ring-campus-primary/30 ${
          error
            ? 'border-campus-danger/70 focus:border-campus-danger'
            : 'border-campus-border focus:border-campus-primary'
        } ${className}`}
        {...props}
      />
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
