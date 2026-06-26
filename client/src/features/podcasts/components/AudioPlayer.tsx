import { useRef } from 'react';
import { MediaSeekBar } from '@/features/podcasts/components/MediaSeekBar';
import { MediaTransportControls } from '@/features/podcasts/components/MediaTransportControls';
import { PauseIcon, PlayIcon } from '@/features/podcasts/components/MediaPlayerIcons';
import { useMediaElement } from '@/features/podcasts/hooks/useMediaElement';
import { useMediaKeyboard } from '@/features/podcasts/hooks/useMediaKeyboard';
import { formatPlayerTime } from '@/features/podcasts/utils/mediaPlayer';
import { PLAYER_COPY } from '@/shared/copy/campusMessages';

interface AudioPlayerProps {
  src: string;
  title: string;
  variant?: 'full' | 'compact';
  knownDurationSeconds?: number;
}

export const AudioPlayer = ({ src, title, variant = 'full', knownDurationSeconds }: AudioPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    error,
    progress,
    togglePlay,
    stop,
    skip,
    onSeek,
    onVolumeChange,
    toggleMute,
  } = useMediaElement(audioRef, src, knownDurationSeconds);

  useMediaKeyboard(containerRef, {
    togglePlay,
    stop,
    skip,
    toggleMute,
    onVolumeChange,
    volume,
    disabled: Boolean(error),
  });

  const isCompact = variant === 'compact';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`campus-media-player campus-audio-player ${isCompact ? 'campus-media-player--compact' : ''}`}
      aria-label={`Leitor de áudio: ${title}`}
      onClick={(event) => event.stopPropagation()}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {error ? (
        <p className="campus-media-player__error" role="alert">
          {error}
        </p>
      ) : null}

      {isCompact ? (
        <div className="campus-media-player__compact-stack">
          <div className="campus-media-player__compact-row">
            <button
              type="button"
              className="campus-media-player__play"
              onClick={togglePlay}
              aria-label={isPlaying ? PLAYER_COPY.pause : PLAYER_COPY.play}
              disabled={Boolean(error)}
            >
              {isLoading && !error ? (
                <span className="campus-media-player__spinner" aria-hidden />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>

            <MediaSeekBar
              currentTime={currentTime}
              duration={duration}
              progress={progress}
              disabled={Boolean(error)}
              onSeek={onSeek}
              className="min-w-0 flex-1"
            />

            <span className="campus-media-player__time-compact">
              {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
            </span>
          </div>

          <MediaTransportControls
            variant="compact"
            playStyle="icon"
            isPlaying={isPlaying}
            isLoading={isLoading}
            error={error}
            volume={volume}
            togglePlay={togglePlay}
            stop={stop}
            skip={skip}
            onVolumeChange={onVolumeChange}
            toggleMute={toggleMute}
          />
        </div>
      ) : (
        <>
          <MediaSeekBar
            currentTime={currentTime}
            duration={duration}
            progress={progress}
            disabled={Boolean(error)}
            onSeek={onSeek}
          />

          <div className="campus-media-player__times">
            <span>{formatPlayerTime(currentTime)}</span>
            <span>{formatPlayerTime(duration)}</span>
          </div>

          <MediaTransportControls
            variant="full"
            playStyle="text"
            isPlaying={isPlaying}
            isLoading={isLoading}
            error={error}
            volume={volume}
            togglePlay={togglePlay}
            stop={stop}
            skip={skip}
            onVolumeChange={onVolumeChange}
            toggleMute={toggleMute}
          />

          <p className="campus-media-player__hint">{PLAYER_COPY.keyboardHint}</p>
        </>
      )}
    </div>
  );
};
