import { useCallback, useEffect, useState } from 'react';
import { BRAND } from '@/shared/styles/brand';
import { getCampusDesktop } from '@/shared/utils/electronBridge';

const MinimizeIcon = () => (
  <svg width="10" height="1" viewBox="0 0 10 1" aria-hidden>
    <rect width="10" height="1" fill="currentColor" />
  </svg>
);

const MaximizeIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
    <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
  </svg>
);

const RestoreIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
    <path
      d="M3 1h6v6H3V1zm1 1v4h4V2H4zm-2 2h6v6H2V4z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const DesktopTitleBar = () => {
  const desktop = getCampusDesktop();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!desktop) return;

    let cancelled = false;
    void desktop.isMaximized().then((maximized) => {
      if (!cancelled) setIsMaximized(maximized);
    });

    const unsubscribe = desktop.onMaximizedChange(setIsMaximized);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [desktop]);

  const onMinimize = useCallback(() => desktop?.minimize(), [desktop]);
  const onMaximize = useCallback(() => desktop?.maximize(), [desktop]);
  const onClose = useCallback(() => desktop?.close(), [desktop]);
  const onDragDoubleClick = useCallback(() => desktop?.maximize(), [desktop]);

  if (!desktop) return null;

  return (
    <header className="campus-desktop-titlebar" data-testid="desktop-titlebar">
      <div className="campus-desktop-titlebar__drag" onDoubleClick={onDragDoubleClick}>
        <img
          src={BRAND.logoIcon}
          alt=""
          width={18}
          height={18}
          className="campus-desktop-titlebar__logo"
          decoding="async"
        />
        <span className="campus-desktop-titlebar__brand">
          <span className="text-campus-primary">CA</span>
          <span className="text-campus-accent">MPUS</span>
        </span>
      </div>

      <div className="campus-desktop-titlebar__controls">
        <button
          type="button"
          className="campus-desktop-titlebar__btn"
          aria-label="Minimizar"
          onClick={onMinimize}
        >
          <MinimizeIcon />
        </button>
        <button
          type="button"
          className="campus-desktop-titlebar__btn"
          aria-label={isMaximized ? 'Restaurar' : 'Maximizar'}
          onClick={onMaximize}
        >
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          type="button"
          className="campus-desktop-titlebar__btn campus-desktop-titlebar__btn--close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>
    </header>
  );
};
