import { useId, useRef, type ChangeEvent, type DragEvent } from 'react';
import { formatFileSize } from '@/features/podcasts/utils/formatFileSize';

interface FileDropzoneProps {
  label: string;
  hint?: string;
  accept: string;
  file: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
  previewUrl?: string | null;
  emptyIcon?: string;
}

export const FileDropzone = ({
  label,
  hint,
  accept,
  file,
  error,
  onFileChange,
  previewUrl,
  emptyIcon = '+',
}: FileDropzoneProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (next: File | null) => {
    onFileChange(next);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    pickFile(selected);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0] ?? null;
    pickFile(dropped);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-campus-foreground">{label}</span>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={`relative flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-none border border-dashed px-4 py-6 text-center transition ${
          error
            ? 'border-campus-danger/60 bg-campus-danger-soft/30'
            : 'border-campus-border bg-black/20 hover:border-campus-primary/45 hover:bg-campus-primary/5'
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={onInputChange}
        />

        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="max-h-28 w-full max-w-[12rem] object-contain"
          />
        ) : (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-none border border-campus-primary/40 bg-campus-primary/10 text-xl font-bold text-campus-primary"
            aria-hidden
          >
            {emptyIcon}
          </span>
        )}

        {file ? (
          <>
            <p className="max-w-full truncate text-sm font-semibold text-campus-foreground">
              {file.name}
            </p>
            <p className="text-xs text-campus-muted">{formatFileSize(file.size)}</p>
            <button
              type="button"
              className="relative z-10 text-xs font-semibold text-campus-primary hover:underline"
              onClick={(event) => {
                event.stopPropagation();
                pickFile(null);
              }}
            >
              Remover ficheiro
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-campus-accent">Arrasta ou clica para escolher</p>
            {hint && <p className="text-xs text-campus-muted">{hint}</p>}
          </>
        )}
      </div>
      {error && (
        <p className="text-xs text-campus-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
