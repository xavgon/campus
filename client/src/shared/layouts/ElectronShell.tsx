import { useEffect, type ReactNode } from 'react';
import { DesktopTitleBar } from '@/shared/components/campus/DesktopTitleBar';

interface ElectronShellProps {
  children: ReactNode;
}

export const ElectronShell = ({ children }: ElectronShellProps) => {
  useEffect(() => {
    document.documentElement.classList.add('campus-electron');
    return () => document.documentElement.classList.remove('campus-electron');
  }, []);

  return (
    <div className="campus-electron-shell flex h-screen flex-col overflow-hidden bg-campus-surface-dark">
      <DesktopTitleBar />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
};
