import { useEffect, useRef, useState } from 'react';

const SKIP_SECONDS = 10;

const formatPlayerTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

interface AudioPlayerProps {
  src: string;
  title: string;
}

export const AudioPlayer = ({ src, title }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Não foi possível reproduzir o áudio. Tenta novamente mais tarde.');
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
    audio.load();
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || error) return;
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play().catch(() => {
        setError('Reprodução bloqueada pelo browser. Clica em Play para iniciar.');
      });
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const skip = (delta: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = Math.min(Math.max(0, audio.currentTime + delta), duration);
  };

  const onSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  const onVolumeChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    setVolume(value);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="campus-panel campus-audio-player" aria-label={`Leitor de áudio: ${title}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {error ? (
        <p className="campus-audio-player__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="campus-audio-player__progress">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="campus-audio-player__seek"
          aria-label="Posição na faixa"
          disabled={!duration || Boolean(error)}
        />
        <div className="campus-audio-player__progress-track" aria-hidden>
          <span className="campus-audio-player__progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="campus-audio-player__times">
        <span>{formatPlayerTime(currentTime)}</span>
        <span>{formatPlayerTime(duration)}</span>
      </div>

      <div className="campus-audio-player__controls">
        <button
          type="button"
          className="campus-audio-player__btn"
          onClick={() => skip(-SKIP_SECONDS)}
          aria-label={`Retroceder ${SKIP_SECONDS} segundos`}
          disabled={Boolean(error)}
        >
          −{SKIP_SECONDS}s
        </button>

        <button
          type="button"
          className="campus-audio-player__btn campus-audio-player__btn--primary"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          disabled={Boolean(error)}
        >
          {isLoading && !error ? '…' : isPlaying ? 'Pausar' : 'Play'}
        </button>

        <button
          type="button"
          className="campus-audio-player__btn"
          onClick={stop}
          aria-label="Parar"
          disabled={Boolean(error)}
        >
          Stop
        </button>

        <button
          type="button"
          className="campus-audio-player__btn"
          onClick={() => skip(SKIP_SECONDS)}
          aria-label={`Avançar ${SKIP_SECONDS} segundos`}
          disabled={Boolean(error)}
        >
          +{SKIP_SECONDS}s
        </button>

        <label className="campus-audio-player__volume">
          <span className="sr-only">Volume</span>
          <span aria-hidden>Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="campus-audio-player__volume-slider"
            aria-label="Volume"
            disabled={Boolean(error)}
          />
        </label>
      </div>
    </div>
  );
};
