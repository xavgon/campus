import { NavUserName } from '@/shared/components/campus/NavUserName';
import type { OnlineUserSummary } from '@/features/presence/types/presence.types';

interface DashboardOnlinePanelProps {
  count: number;
  users: OnlineUserSummary[];
  isLoading?: boolean;
  hasError?: boolean;
}

export const DashboardOnlinePanel = ({
  count,
  users,
  isLoading,
  hasError,
}: DashboardOnlinePanelProps) => (
  <div className="campus-panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
    <div className="flex items-center gap-4">
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-none border border-campus-primary/40 bg-campus-primary/10"
        aria-hidden
      >
        <span className="text-2xl font-bold tabular-nums text-campus-primary">
          {isLoading ? '…' : count}
        </span>
        {!isLoading && !hasError && (
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-campus-primary opacity-60" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-campus-primary" />
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-campus-primary">
          Em tempo real
        </p>
        <h2 className="mt-0.5 text-lg font-bold text-campus-foreground">
          {isLoading
            ? 'A contar utilizadores…'
            : hasError
              ? 'Ligação indisponível'
              : count === 1
                ? '1 utilizador ligado'
                : `${count} utilizadores ligados`}
        </h2>
        <p className="mt-1 text-sm text-campus-accent">
          {hasError
            ? 'Confirma que a API está a correr e volta a actualizar.'
            : 'Na plataforma nos últimos 90 segundos (sessão activa).'}
        </p>
      </div>
    </div>

    {!isLoading && !hasError && users.length > 0 && (
      <div className="min-w-0 sm:max-w-[50%] lg:max-w-md">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-campus-muted">
          Sessões activas
        </p>
        <ul className="flex flex-wrap gap-2">
          {users.slice(0, 6).map((user) => (
            <li
              key={user.userId}
              className="max-w-full truncate rounded-none border border-campus-border/70 bg-black/30 px-2.5 py-1 text-xs font-medium text-campus-foreground"
            >
              <NavUserName nome={user.nome} />
            </li>
          ))}
          {users.length > 6 && (
            <li className="rounded-none border border-dashed border-campus-border/60 px-2.5 py-1 text-xs text-campus-muted">
              +{users.length - 6}
            </li>
          )}
        </ul>
      </div>
    )}
  </div>
);
