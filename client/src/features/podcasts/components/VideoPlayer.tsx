import { useRef } from 'react';
import { MediaSeekBar } from '@/features/podcasts/components/MediaSeekBar';
import { MediaTransportControls } from '@/features/podcasts/components/MediaTransportControls';
import {
  FullscreenIcon,
  PauseIcon,
  PlayIcon,
} from '@/features/podcasts/components/MediaPlayerIcons';
import { useMediaElement } from '@/features/podcasts/hooks/useMediaElement';
import { useMediaKeyboard } from '@/features/podcasts/hooks/useMediaKeyboard';
import { formatPlayerTime } from '@/features/podcasts/utils/mediaPlayer';
import { PLAYER_COPY } from '@/shared/copy/campusMessages';

interface VideoPlayerProps {
  src: string;
  title: string;
  variant?: 'full' | 'compact';
  poster?: string;
  knownDurationSeconds?: number;
}

export const VideoPlayer = ({ src, title, variant = 'full', poster, knownDurationSeconds }: VideoPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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
  } = useMediaElement(videoRef, src, knownDurationSeconds);

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

  const toggleFullscreen = () => {
    const frame = frameRef.current;
    if (!frame) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void frame.requestFullscreen?.();
  };

  const fullscreenButton = (
    <button
      type="button"
      className="campus-media-player__icon-btn ml-auto"
      onClick={toggleFullscreen}
      aria-label={PLAYER_COPY.fullscreen}
      disabled={Boolean(error)}
    >
      <FullscreenIcon />
    </button>
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`campus-media-player campus-video-player ${isCompact ? 'campus-media-player--compact campus-video-player--compact' : ''}`}
      aria-label={`Leitor de vídeo: ${title}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div ref={frameRef} className="campus-video-player__frame">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          className="campus-video-player__video"
        />

        {!isCompact && !error && (
          <button
            type="button"
            className={`campus-video-player__overlay-play ${isPlaying ? 'pointer-events-none opacity-0' : ''}`}
            onClick={togglePlay}
            aria-label={isPlaying ? PLAYER_COPY.pause : PLAYER_COPY.play}
            aria-hidden={isPlaying}
            tabIndex={isPlaying ? -1 : 0}
          >
            {isLoading ? (
              <span className="campus-media-player__spinner campus-media-player__spinner--lg" aria-hidden />
            ) : isPlaying ? (
              <PauseIcon className="h-8 w-8" />
            ) : (
              <PlayIcon className="h-8 w-8" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p className="campus-media-player__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className={isCompact ? 'campus-video-player__compact-bar' : 'campus-video-player__bar'}>
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
              trailing={fullscreenButton}
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

            <div className="campus-media-player__controls campus-video-player__controls">
              <MediaTransportControls
                variant="full"
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
                trailing={
                  <>
                    <span className="campus-media-player__time-compact">
                      {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
                    </span>
                    {fullscreenButton}
                  </>
                }
              />
            </div>

            <p className="campus-media-player__hint">{PLAYER_COPY.keyboardHint}</p>
          </>
        )}
      </div>
    </div>
  );
};
