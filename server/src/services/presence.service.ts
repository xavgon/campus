/** Utilizador considerado ligado se enviou heartbeat nos últimos 90 s */
export const PRESENCE_TTL_MS = 90_000;

interface PresenceEntry {
  userId: string;
  nome: string;
  lastSeen: number;
}

const online = new Map<string, PresenceEntry>();

const pruneStale = (): void => {
  const now = Date.now();
  for (const [userId, entry] of online) {
    if (now - entry.lastSeen > PRESENCE_TTL_MS) {
      online.delete(userId);
    }
  }
};

export const touchPresence = (userId: string, nome: string): void => {
  online.set(userId, { userId, nome, lastSeen: Date.now() });
  pruneStale();
};

export const removePresence = (userId: string): void => {
  online.delete(userId);
};

export interface OnlineUserSummary {
  userId: string;
  nome: string;
}

export const getOnlineSnapshot = (): { count: number; users: OnlineUserSummary[] } => {
  pruneStale();
  const users = [...online.values()]
    .map(({ userId, nome }) => ({ userId, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  return { count: users.length, users };
};
