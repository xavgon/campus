/**
 * Lista de clientes autorizados SEM certificado (Task 8 — Mecanismo de Excepção).
 *
 * Este módulo existe APENAS no servidor e nunca é exposto via API pública.
 * Em desenvolvimento, o proxy Vite (localhost) é adicionado automaticamente.
 * Em produção, a lista começa vazia — o administrador adiciona manualmente via script.
 */

interface AllowedClient {
  ip: string;
  reason: string;
  addedAt: Date;
}

// Lista em memória — persiste enquanto o servidor estiver a correr
const allowlist: Map<string, AllowedClient> = new Map();

// Em desenvolvimento, o proxy Vite corre em localhost → adicionar automaticamente
// para que o browser consiga aceder à API sem certificado de cliente.
// Em produção isto não existe — todos os clientes precisam de certificado.
if (process.env.NODE_ENV !== 'production') {
  const devIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  for (const ip of devIps) {
    allowlist.set(ip, {
      ip,
      reason: 'Proxy Vite (desenvolvimento) — excepção automática',
      addedAt: new Date(),
    });
  }
  console.log('[CAMPUS] [mTLS] Excepção de desenvolvimento: localhost permitido sem certificado.');
}

/** Verifica se um IP está na allowlist. */
export const isClientAllowed = (ip: string): boolean => allowlist.has(ip);

/** Adiciona um cliente à allowlist (Task 8 — uso administrativo). */
export const allowClient = (ip: string, reason: string): void => {
  allowlist.set(ip, { ip, reason, addedAt: new Date() });
  console.log(`[CAMPUS] [mTLS] Cliente adicionado à allowlist: ${ip} — ${reason}`);
};

/** Remove um cliente da allowlist. */
export const revokeClient = (ip: string): boolean => {
  const existed = allowlist.has(ip);
  allowlist.delete(ip);
  if (existed) console.log(`[CAMPUS] [mTLS] Cliente removido da allowlist: ${ip}`);
  return existed;
};

/** Lista todos os clientes na allowlist (para inspecção administrativa). */
export const listAllowedClients = (): AllowedClient[] => [...allowlist.values()];
