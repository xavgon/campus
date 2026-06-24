import { useRef } from 'react';
import { MediaSeekBar } from '@/features/podcasts/components/MediaSeekBar';
import {
  FullscreenIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon,
  VolumeMutedIcon,
} from '@/features/podcasts/components/MediaPlayerIcons';
import { useMediaElement } from '@/features/podcasts/hooks/useMediaElement';
import { formatPlayerTime } from '@/features/podcasts/utils/mediaPlayer';

const SKIP_SECONDS = 10;

interface VideoPlayerProps {
  src: string;
  title: string;
  variant?: 'full' | 'compact';
  poster?: string;
}

export const VideoPlayer = ({ src, title, variant = 'full', poster }: VideoPlayerProps) => {
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
  } = useMediaElement(videoRef, src);

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

  return (
    <div
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
            aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
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
          <div className="campus-media-player__compact-row">
            <button
              type="button"
              className="campus-media-player__play"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
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
              <button
                type="button"
                className="campus-media-player__play campus-media-player__play--bar"
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
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

              <span className="campus-media-player__time-compact">
                {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
              </span>

              <button
                type="button"
                className="campus-media-player__btn"
                onClick={() => skip(-SKIP_SECONDS)}
                aria-label={`Retroceder ${SKIP_SECONDS} segundos`}
                disabled={Boolean(error)}
              >
                −{SKIP_SECONDS}s
              </button>

              <button
                type="button"
                className="campus-media-player__btn"
                onClick={stop}
                aria-label="Parar"
                disabled={Boolean(error)}
              >
                Stop
              </button>

              <button
                type="button"
                className="campus-media-player__btn"
                onClick={() => skip(SKIP_SECONDS)}
                aria-label={`Avançar ${SKIP_SECONDS} segundos`}
                disabled={Boolean(error)}
              >
                +{SKIP_SECONDS}s
              </button>

              <label className="campus-media-player__volume">
                <span className="sr-only">Volume</span>
                <button
                  type="button"
                  className="campus-media-player__icon-btn"
                  onClick={toggleMute}
                  aria-label={volume > 0 ? 'Silenciar' : 'Activar som'}
                  disabled={Boolean(error)}
                >
                  {volume > 0 ? <VolumeIcon /> : <VolumeMutedIcon />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="campus-media-player__volume-slider"
                  aria-label="Volume"
                  disabled={Boolean(error)}
                />
              </label>

              <button
                type="button"
                className="campus-media-player__icon-btn ml-auto"
                onClick={toggleFullscreen}
                aria-label="Ecrã inteiro"
                disabled={Boolean(error)}
              >
                <FullscreenIcon />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
