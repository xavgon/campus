/**
 * Lista de clientes autorizados SEM certificado (Task 8 — Mecanismo de Excepção).
 * Cache em memória sincronizado com a tabela `mtls_allowlist`.
 */
import { config } from '../config';
import {
  deleteAllowlistRow,
  listAllowlistRows,
  upsertAllowlistRow,
} from '../models/allowlist.model';

export interface AllowedClient {
  ip: string;
  reason: string;
  addedAt: Date;
}

const allowlist = new Map<string, AllowedClient>();

const cacheRow = (ip: string, reason: string, addedAt: string): void => {
  allowlist.set(ip, { ip, reason, addedAt: new Date(addedAt) });
};

/** Carrega allowlist da BD e aplica excepções de desenvolvimento se aplicável. */
export const initAllowlistFromDb = async (): Promise<void> => {
  allowlist.clear();

  const rows = await listAllowlistRows();
  for (const row of rows) {
    cacheRow(row.ip, row.reason, row.added_at);
  }

  if (config.mtlsStrict || config.nodeEnv === 'production') {
    console.log(`[CAMPUS] [mTLS] Allowlist carregada: ${allowlist.size} entrada(s).`);
    return;
  }

  const devIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  for (const ip of devIps) {
    if (!allowlist.has(ip)) {
      const row = await upsertAllowlistRow(
        ip,
        'Proxy Vite (desenvolvimento) — excepção automática',
        null,
      );
      cacheRow(row.ip, row.reason, row.added_at);
    }
  }

  console.log(
    `[CAMPUS] [mTLS] Excepção de desenvolvimento: localhost permitido sem certificado (${allowlist.size} entrada(s)).`,
  );
};

/** Verifica se um IP está na allowlist. */
export const isClientAllowed = (ip: string): boolean => allowlist.has(ip);

/** Adiciona um cliente à allowlist (Task 8 — uso administrativo). */
export const allowClient = async (
  ip: string,
  reason: string,
  addedBy?: string | null,
): Promise<void> => {
  const row = await upsertAllowlistRow(ip, reason, addedBy ?? null);
  cacheRow(row.ip, row.reason, row.added_at);
  console.log(`[CAMPUS] [mTLS] Cliente adicionado à allowlist: ${ip} — ${reason}`);
};

/** Remove um cliente da allowlist. */
export const revokeClient = async (ip: string): Promise<boolean> => {
  const removed = await deleteAllowlistRow(ip);
  if (removed) {
    allowlist.delete(ip);
    console.log(`[CAMPUS] [mTLS] Cliente removido da allowlist: ${ip}`);
  }
  return removed;
};

/** Lista todos os clientes na allowlist (cache sincronizado com BD). */
export const listAllowedClients = (): AllowedClient[] =>
  [...allowlist.values()].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
