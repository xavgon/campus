import { useEffect, useRef, type FormEvent } from 'react';
import { LIVE_COMMENT_MAX_LENGTH } from '@/features/live/constants';
import type { LiveComment } from '@/features/live/types/live.types';
import { formatLiveCommentTime } from '@/features/live/utils/liveComments';
import { ProfileAvatar } from '@/features/profile/components/ProfileAvatar';
import { Button } from '@/shared/components/ui/Button';

interface LiveCommentsPanelProps {
  comments: LiveComment[];
  onSend: (body: string) => void;
  commentError?: string | null;
  disabled?: boolean;
  readOnly?: boolean;
  title?: string;
}

export const LiveCommentsPanel = ({
  comments,
  onSend,
  commentError,
  disabled = false,
  readOnly = false,
  title = 'Comentários',
}: LiveCommentsPanelProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [comments.length]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = inputRef.current?.value.trim() ?? '';
    if (!value || disabled || readOnly) return;
    onSend(value);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section className="campus-panel flex min-h-[280px] flex-col overflow-hidden">
      <header className="border-b border-campus-border px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-campus-muted">{title}</h2>
        <p className="mt-0.5 text-xs text-campus-accent">
          {readOnly ? 'Histórico da transmissão' : 'Conversa em tempo real com outros ouvintes'}
        </p>
      </header>

      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        aria-live="polite"
        aria-label="Lista de comentários"
      >
        {comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-campus-muted">
            {readOnly ? 'Sem comentários nesta transmissão.' : 'Ainda não há comentários — sê o primeiro a participar.'}
          </p>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="flex gap-2.5">
              <ProfileAvatar nome={comment.authorNome} fotoUrl={comment.authorFoto} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={`text-sm font-semibold ${comment.isHost ? 'text-campus-primary' : 'text-campus-foreground'}`}
                  >
                    {comment.authorNome}
                    {comment.isHost && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-campus-primary/80">
                        Anfitrião
                      </span>
                    )}
                  </span>
                  <time className="text-[10px] text-campus-muted" dateTime={comment.createdAt}>
                    {formatLiveCommentTime(comment.createdAt)}
                  </time>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-campus-accent">
                  {comment.body}
                </p>
              </div>
            </article>
          ))
        )}
      </div>

      {!readOnly && (
        <form onSubmit={onSubmit} className="border-t border-campus-border p-3">
          <label htmlFor="liveComment" className="sr-only">
            Escrever comentário
          </label>
          <textarea
            id="liveComment"
            ref={inputRef}
            rows={2}
            maxLength={LIVE_COMMENT_MAX_LENGTH}
            disabled={disabled}
            placeholder="Escreve um comentário…"
            className="w-full resize-none rounded-none border border-campus-border bg-campus-surface-elevated px-3 py-2 text-sm text-campus-foreground outline-none focus:border-campus-primary focus:ring-2 focus:ring-campus-primary/30 disabled:opacity-60"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {commentError ? (
              <p className="text-xs text-campus-danger">{commentError}</p>
            ) : (
              <p className="text-xs text-campus-muted">Máx. {LIVE_COMMENT_MAX_LENGTH} caracteres</p>
            )}
            <Button type="submit" disabled={disabled} className="shrink-0">
              Enviar
            </Button>
          </div>
        </form>
      )}
    </section>
  );
};
