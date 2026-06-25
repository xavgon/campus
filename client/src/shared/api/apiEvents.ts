export type ApiToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ApiToastPayload {
  variant: ApiToastVariant;
  title: string;
  message?: string;
  durationMs?: number;
}

type ApiEventMap = {
  'session-expired': void;
  toast: ApiToastPayload;
};

type ApiEventHandler<K extends keyof ApiEventMap> = (payload: ApiEventMap[K]) => void;

const listeners: {
  [K in keyof ApiEventMap]?: Set<ApiEventHandler<K>>;
} = {};

export const onApiEvent = <K extends keyof ApiEventMap>(
  event: K,
  handler: ApiEventHandler<K>,
): (() => void) => {
  if (!listeners[event]) {
    listeners[event] = new Set() as (typeof listeners)[K];
  }
  listeners[event]!.add(handler as ApiEventHandler<K>);
  return () => {
    listeners[event]?.delete(handler as ApiEventHandler<K>);
  };
};

export const dispatchApiEvent = <K extends keyof ApiEventMap>(
  event: K,
  ...args: ApiEventMap[K] extends void ? [] : [ApiEventMap[K]]
): void => {
  const handlers = listeners[event];
  if (!handlers) return;
  for (const handler of handlers) {
    handler(args[0] as ApiEventMap[K]);
  }
};
