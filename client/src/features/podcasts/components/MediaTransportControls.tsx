import type { ReactNode } from 'react';
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  StopIcon,
  VolumeIcon,
  VolumeMutedIcon,
} from '@/features/podcasts/components/MediaPlayerIcons';
import { SKIP_SECONDS } from '@/features/podcasts/utils/mediaPlayer';
import { PLAYER_COPY } from '@/shared/copy/campusMessages';

interface MediaTransportControlsProps {
  variant: 'full' | 'compact';
  playStyle?: 'icon' | 'text';
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  volume: number;
  skipSeconds?: number;
  togglePlay: () => void;
  stop: () => void;
  skip: (delta: number) => void;
  onVolumeChange: (value: number) => void;
  toggleMute: () => void;
  trailing?: ReactNode;
}

export const MediaTransportControls = ({
  variant,
  playStyle = 'text',
  isPlaying,
  isLoading,
  error,
  volume,
  skipSeconds = SKIP_SECONDS,
  togglePlay,
  stop,
  skip,
  onVolumeChange,
  toggleMute,
  trailing,
}: MediaTransportControlsProps) => {
  const disabled = Boolean(error);
  const playLabel = isPlaying ? PLAYER_COPY.pause : PLAYER_COPY.play;

  const playButton =
    playStyle === 'icon' ? (
      <button
        type="button"
        className="campus-media-player__play campus-media-player__play--bar"
        onClick={togglePlay}
        aria-label={playLabel}
        disabled={disabled}
      >
        {isLoading && !error ? (
          <span className="campus-media-player__spinner" aria-hidden />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>
    ) : (
      <button
        type="button"
        className="campus-media-player__btn campus-media-player__btn--primary"
        onClick={togglePlay}
        aria-label={playLabel}
        disabled={disabled}
      >
        {isLoading && !error ? '…' : isPlaying ? PLAYER_COPY.pause : PLAYER_COPY.play}
      </button>
    );

  const skipBackControl =
    variant === 'compact' ? (
      <button
        type="button"
        className="campus-media-player__icon-btn"
        onClick={() => skip(-skipSeconds)}
        aria-label={PLAYER_COPY.skipBack(skipSeconds)}
        disabled={disabled}
      >
        <SkipBackIcon />
      </button>
    ) : (
      <button
        type="button"
        className="campus-media-player__btn"
        onClick={() => skip(-skipSeconds)}
        aria-label={PLAYER_COPY.skipBack(skipSeconds)}
        disabled={disabled}
      >
        −{skipSeconds}s
      </button>
    );

  const skipForwardControl =
    variant === 'compact' ? (
      <button
        type="button"
        className="campus-media-player__icon-btn"
        onClick={() => skip(skipSeconds)}
        aria-label={PLAYER_COPY.skipForward(skipSeconds)}
        disabled={disabled}
      >
        <SkipForwardIcon />
      </button>
    ) : (
      <button
        type="button"
        className="campus-media-player__btn"
        onClick={() => skip(skipSeconds)}
        aria-label={PLAYER_COPY.skipForward(skipSeconds)}
        disabled={disabled}
      >
        +{skipSeconds}s
      </button>
    );

  const stopControl =
    variant === 'compact' ? (
      <button
        type="button"
        className="campus-media-player__icon-btn"
        onClick={stop}
        aria-label={PLAYER_COPY.stop}
        disabled={disabled}
      >
        <StopIcon />
      </button>
    ) : (
      <button
        type="button"
        className="campus-media-player__btn"
        onClick={stop}
        aria-label={PLAYER_COPY.stop}
        disabled={disabled}
      >
        {PLAYER_COPY.stop}
      </button>
    );

  const volumeControl = (
    <label className={variant === 'compact' ? 'campus-media-player__volume-compact' : 'campus-media-player__volume'}>
      <span className="sr-only">{PLAYER_COPY.volume}</span>
      <button
        type="button"
        className="campus-media-player__icon-btn"
        onClick={toggleMute}
        aria-label={volume > 0 ? PLAYER_COPY.mute : PLAYER_COPY.unmute}
        disabled={disabled}
      >
        {volume > 0 ? <VolumeIcon /> : <VolumeMutedIcon />}
      </button>
      {variant === 'full' ? (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="campus-media-player__volume-slider"
          aria-label={PLAYER_COPY.volume}
          disabled={disabled}
        />
      ) : null}
    </label>
  );

  if (variant === 'compact') {
    return (
      <div className="campus-media-player__compact-controls">
        {skipBackControl}
        {stopControl}
        {skipForwardControl}
        {volumeControl}
        {trailing}
      </div>
    );
  }

  return (
    <div className="campus-media-player__controls">
      {playStyle === 'icon' ? playButton : null}
      {skipBackControl}
      {playStyle === 'text' ? playButton : null}
      {stopControl}
      {skipForwardControl}
      {volumeControl}
      {trailing}
    </div>
  );
};
