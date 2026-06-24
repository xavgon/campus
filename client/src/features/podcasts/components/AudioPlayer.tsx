import { useRef } from 'react';
import { MediaSeekBar } from '@/features/podcasts/components/MediaSeekBar';
import { PauseIcon, PlayIcon, VolumeIcon, VolumeMutedIcon } from '@/features/podcasts/components/MediaPlayerIcons';
import { useMediaElement } from '@/features/podcasts/hooks/useMediaElement';
import { formatPlayerTime } from '@/features/podcasts/utils/mediaPlayer';

const SKIP_SECONDS = 10;

interface AudioPlayerProps {
  src: string;
  title: string;
  variant?: 'full' | 'compact';
}

export const AudioPlayer = ({ src, title, variant = 'full' }: AudioPlayerProps) => {
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
  } = useMediaElement(audioRef, src);

  const isCompact = variant === 'compact';

  return (
    <div
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

          <div className="campus-media-player__times">
            <span>{formatPlayerTime(currentTime)}</span>
            <span>{formatPlayerTime(duration)}</span>
          </div>

          <div className="campus-media-player__controls">
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
              className="campus-media-player__btn campus-media-player__btn--primary"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              disabled={Boolean(error)}
            >
              {isLoading && !error ? '…' : isPlaying ? 'Pausar' : 'Play'}
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
          </div>
        </>
      )}
    </div>
  );
};
