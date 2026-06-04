import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = ({ label, error, id, className = '', ...props }: InputProps) => {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1 text-left">
      <label htmlFor={inputId} className="text-sm font-medium text-campus-accent">
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded-none border border-campus-border bg-campus-secondary px-3 py-2 text-sm text-campus-foreground outline-none transition placeholder:text-campus-muted focus:border-campus-primary focus:ring-2 focus:ring-campus-primary/30 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
};
