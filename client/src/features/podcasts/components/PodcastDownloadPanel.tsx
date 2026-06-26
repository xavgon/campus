import { useState } from 'react';
import {
  canDownloadPodcast,
  downloadPodcast,
  type DownloadPodcastMedia,
} from '@/features/podcasts/services/podcast.service';
import type { Podcast } from '@/features/podcasts/types/podcast';
import { Alert } from '@/shared/components/campus/Alert';
import { Button } from '@/shared/components/ui/Button';
import { DOWNLOAD_COPY, ERROR_TITLES } from '@/shared/copy/campusMessages';
import { getApiErrorMessage } from '@/shared/api/client';

interface PodcastDownloadPanelProps {
  podcast: Podcast;
  withVideo: boolean;
}

export const PodcastDownloadPanel = ({ podcast, withVideo }: PodcastDownloadPanelProps) => {
  const [activeMedia, setActiveMedia] = useState<DownloadPodcastMedia | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canDownloadAudio = canDownloadPodcast(podcast, 'audio');
  const canDownloadVideo = withVideo && canDownloadPodcast(podcast, 'video');

  if (!canDownloadAudio && !canDownloadVideo) {
    return (
      <p className="text-xs text-campus-muted">{DOWNLOAD_COPY.unavailable}</p>
    );
  }

  const onDownload = async (media: DownloadPodcastMedia) => {
    setError(null);
    setActiveMedia(media);
    try {
      await downloadPodcast(podcast, media);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setActiveMedia(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {canDownloadAudio && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void onDownload('audio')}
            disabled={activeMedia != null}
          >
            {activeMedia === 'audio' ? DOWNLOAD_COPY.inProgress : DOWNLOAD_COPY.audioButton}
          </Button>
        )}
        {canDownloadVideo && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void onDownload('video')}
            disabled={activeMedia != null}
          >
            {activeMedia === 'video' ? DOWNLOAD_COPY.inProgress : DOWNLOAD_COPY.videoButton}
          </Button>
        )}
      </div>
      <p className="text-xs text-campus-muted">
        {canDownloadVideo ? DOWNLOAD_COPY.videoHint : DOWNLOAD_COPY.audioHint}
      </p>
      {error ? <Alert title={ERROR_TITLES.download} message={error} /> : null}
    </div>
  );
};
