import { useEffect, useState, type RefObject } from 'react';
import { MEDIA_COPY } from '@/shared/copy/campusMessages';

export const useMediaElement = (
  mediaRef: RefObject<HTMLMediaElement | null>,
  src: string,
  fallbackDurationSeconds?: number,
) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const onLoadedMetadata = () => {
      const fromMedia =
        Number.isFinite(media.duration) && media.duration > 0 ? media.duration : 0;
      const fromApi =
        fallbackDurationSeconds != null && fallbackDurationSeconds > 0
          ? fallbackDurationSeconds
          : 0;
      setDuration(fromMedia || fromApi);
      setIsLoading(false);
      setError(null);
    };
    const onTimeUpdate = () => setCurrentTime(media.currentTime);
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
      setError(MEDIA_COPY.playbackFailed);
    };

    media.addEventListener('loadedmetadata', onLoadedMetadata);
    media.addEventListener('timeupdate', onTimeUpdate);
    media.addEventListener('play', onPlay);
    media.addEventListener('pause', onPause);
    media.addEventListener('ended', onEnded);
    media.addEventListener('waiting', onWaiting);
    media.addEventListener('canplay', onCanPlay);
    media.addEventListener('error', onError);

    return () => {
      media.removeEventListener('loadedmetadata', onLoadedMetadata);
      media.removeEventListener('timeupdate', onTimeUpdate);
      media.removeEventListener('play', onPlay);
      media.removeEventListener('pause', onPause);
      media.removeEventListener('ended', onEnded);
      media.removeEventListener('waiting', onWaiting);
      media.removeEventListener('canplay', onCanPlay);
      media.removeEventListener('error', onError);
    };
  }, [mediaRef, src, fallbackDurationSeconds]);

  useEffect(() => {
    if (fallbackDurationSeconds != null && fallbackDurationSeconds > 0) {
      setDuration((prev) => (prev > 0 ? prev : fallbackDurationSeconds));
    }
  }, [fallbackDurationSeconds]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    media.pause();
    media.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    setError(null);
    media.load();
  }, [mediaRef, src]);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media || error) return;
    if (isPlaying) {
      media.pause();
    } else {
      void media.play().catch(() => {
        setError(MEDIA_COPY.autoplayBlocked);
      });
    }
  };

  const stop = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.pause();
    media.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const skip = (delta: number) => {
    const media = mediaRef.current;
    if (!media || !duration) return;
    media.currentTime = Math.min(Math.max(0, media.currentTime + delta), duration);
  };

  const onSeek = (value: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = value;
    setCurrentTime(value);
  };

  const onVolumeChange = (value: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.volume = value;
    media.muted = value === 0;
    setVolume(value);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.volume > 0) {
      media.volume = 0;
      media.muted = true;
      setVolume(0);
      return;
    }
    media.volume = 1;
    media.muted = false;
    setVolume(1);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
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
  };
};
