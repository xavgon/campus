import { PLAYER_COPY } from '@/shared/copy/campusMessages';

interface MediaSeekBarProps {
  currentTime: number;
  duration: number;
  progress: number;
  disabled?: boolean;
  onSeek: (value: number) => void;
  className?: string;
}

export const MediaSeekBar = ({
  currentTime,
  duration,
  progress,
  disabled,
  onSeek,
  className = '',
}: MediaSeekBarProps) => (
  <div className={`campus-media-seek ${className}`}>
    <input
      type="range"
      min={0}
      max={duration || 0}
      step={0.1}
      value={currentTime}
      onChange={(e) => onSeek(Number(e.target.value))}
      className="campus-media-seek__input"
      aria-label={PLAYER_COPY.seek}
      disabled={disabled || !duration}
    />
    <div className="campus-media-seek__track" aria-hidden>
      <span className="campus-media-seek__fill" style={{ width: `${progress}%` }} />
    </div>
  </div>
);
