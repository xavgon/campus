import { useEffect } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  sendPresenceHeartbeat,
  sendPresenceLeave,
} from '@/features/presence/services/presence.service';

const HEARTBEAT_INTERVAL_MS = 25_000;

/** Mantém o utilizador marcado como ligado enquanto a área autenticada está aberta */
export const usePresenceSession = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const ping = () => {
      void sendPresenceHeartbeat().catch(() => {});
    };

    ping();
    const intervalId = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      void sendPresenceLeave().catch(() => {});
    };
  }, [isAuthenticated, isLoading]);
};
