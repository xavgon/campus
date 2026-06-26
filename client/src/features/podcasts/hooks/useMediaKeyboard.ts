import { useEffect, type RefObject } from 'react';
import { SKIP_SECONDS } from '@/features/podcasts/utils/mediaPlayer';

interface MediaKeyboardHandlers {
  togglePlay: () => void;
  stop: () => void;
  skip: (delta: number) => void;
  toggleMute: () => void;
  onVolumeChange?: (value: number) => void;
  volume?: number;
  disabled?: boolean;
}

const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
};

export const useMediaKeyboard = (
  containerRef: RefObject<HTMLElement | null>,
  handlers: MediaKeyboardHandlers,
  skipSeconds = SKIP_SECONDS,
) => {
  const { togglePlay, stop, skip, toggleMute, onVolumeChange, volume = 1, disabled } = handlers;

  useEffect(() => {
    const node = containerRef.current;
    if (!node || disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      switch (event.key) {
        case ' ':
        case 'k':
        case 'K':
          event.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          skip(-skipSeconds);
          break;
        case 'ArrowRight':
          event.preventDefault();
          skip(skipSeconds);
          break;
        case 'Home':
          event.preventDefault();
          stop();
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          toggleMute();
          break;
        case 'ArrowUp':
          if (!onVolumeChange) break;
          event.preventDefault();
          onVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          if (!onVolumeChange) break;
          event.preventDefault();
          onVolumeChange(Math.max(0, volume - 0.1));
          break;
        default:
          break;
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => node.removeEventListener('keydown', onKeyDown);
  }, [containerRef, disabled, onVolumeChange, skip, skipSeconds, stop, toggleMute, togglePlay, volume]);
};
