import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiToastStack } from '@/shared/components/campus/ApiToastStack';
import {
  onApiEvent,
  type ApiToastPayload,
  type ApiToastVariant,
} from '@/shared/api/apiEvents';

export interface ApiToastItem extends ApiToastPayload {
  id: string;
}

interface ApiToastContextValue {
  toasts: ApiToastItem[];
  showToast: (payload: ApiToastPayload) => void;
  dismissToast: (id: string) => void;
}

const ApiToastContext = createContext<ApiToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 6_000;

let toastCounter = 0;

const nextToastId = () => {
  toastCounter += 1;
  return `toast-${toastCounter}`;
};

export const ApiToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ApiToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (payload: ApiToastPayload) => {
      const id = nextToastId();
      const item: ApiToastItem = {
        id,
        durationMs: DEFAULT_DURATION_MS,
        ...payload,
      };
      setToasts((prev) => [...prev, item]);

      const duration = item.durationMs ?? DEFAULT_DURATION_MS;
      window.setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast],
  );

  useEffect(() => {
    return onApiEvent('toast', (payload) => {
      showToast(payload);
    });
  }, [showToast]);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ApiToastContext.Provider value={value}>
      {children}
      <ApiToastStack toasts={toasts} onDismiss={dismissToast} />
    </ApiToastContext.Provider>
  );
};

export const useApiToast = (): ApiToastContextValue => {
  const ctx = useContext(ApiToastContext);
  if (!ctx) {
    throw new Error('useApiToast deve ser usado dentro de ApiToastProvider');
  }
  return ctx;
};

export type { ApiToastVariant };
