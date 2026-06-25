import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { onApiEvent } from '@/shared/api/apiEvents';
import { SESSION_COPY } from '@/shared/copy/campusMessages';
import { useApiToast } from '@/shared/context/ApiToastContext';

/** Liga eventos globais da API (401, toasts) ao router e ao contexto de auth. */
export const ApiBootstrap = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useApiToast();
  const handlingSessionRef = useRef(false);

  useEffect(() => {
    const offSession = onApiEvent('session-expired', () => {
      if (handlingSessionRef.current) return;
      handlingSessionRef.current = true;

      logout();
      showToast({
        variant: 'warning',
        title: SESSION_COPY.expiredToastTitle,
        message: SESSION_COPY.expiredToast,
        durationMs: 8_000,
      });
      navigate('/login', { replace: true, state: { reason: 'session-expired' } });

      window.setTimeout(() => {
        handlingSessionRef.current = false;
      }, 500);
    });

    return offSession;
  }, [logout, navigate, showToast]);

  return null;
};
