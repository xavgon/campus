import type { Podcast } from '@/features/podcasts/types/podcast';
import { AudioPlayer } from '@/features/podcasts/components/AudioPlayer';
import { VideoPlayer } from '@/features/podcasts/components/VideoPlayer';
import {
  canPlayPodcast,
  getPodcastStreamUrl,
  getPodcastVideoStreamUrl,
  hasPodcastVideo,
} from '@/features/podcasts/services/podcast.service';

interface PodcastCardMediaProps {
  podcast: Podcast;
}

export const PodcastCardMedia = ({ podcast }: PodcastCardMediaProps) => {
  if (!canPlayPodcast(podcast)) return null;

  const withVideo = hasPodcastVideo(podcast);
  const videoSrc = withVideo ? getPodcastVideoStreamUrl(podcast.id) : null;
  const audioSrc = getPodcastStreamUrl(podcast.id);

  if (withVideo && videoSrc) {
    return (
      <VideoPlayer
        src={videoSrc}
        title={podcast.title}
        variant="compact"
        poster={podcast.coverUrl}
      />
    );
  }

  if (audioSrc) {
    return <AudioPlayer src={audioSrc} title={podcast.title} variant="compact" />;
  }

  return null;
};
