import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/shared/components/ui/icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export const Modal = ({ open, onClose, title, description, children }: ModalProps) => {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="campus-modal-root" role="presentation">
      <button
        type="button"
        className="campus-modal-backdrop absolute inset-0"
        aria-label="Fechar janela"
        onClick={onClose}
      />

      <div className="campus-modal-center pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className="campus-modal-panel campus-panel pointer-events-auto relative w-full max-w-md p-6 sm:p-8"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-xl font-bold text-campus-foreground sm:text-2xl">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-campus-accent">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-campus-muted transition hover:text-campus-primary"
              aria-label="Fechar"
            >
              <CloseIcon />
            </button>
          </div>

          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};
