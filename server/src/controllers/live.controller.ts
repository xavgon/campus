import type { Request, Response } from 'express';
import * as liveVodService from '../services/liveVod.service';
import { getCompletedRecordings } from '../live/live.recorder';
import { sendSuccess } from '../utils/apiResponse';
import { validateCreatePodcast } from '../validations/podcast.validation';

export const listRecordings = async (_req: Request, res: Response): Promise<void> => {
  const recordings = getCompletedRecordings().map((rec) => ({
    id: rec.id,
    title: rec.title,
    mediaType: rec.mediaType,
    durationSeconds: rec.durationSeconds,
    startedAt: rec.startedAt,
    endedAt: rec.endedAt,
    hasAudio: Boolean(rec.audioFile),
    hasVideo: Boolean(rec.videoFile),
    publishedPodcastId: rec.publishedPodcastId ?? null,
  }));
  sendSuccess(res, { recordings, total: recordings.length });
};

export const publishRecording = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Autenticação necessária', data: null });
    return;
  }

  const input = validateCreatePodcast(req.body);
  const podcast = await liveVodService.publishServerRecordingAsPodcast(
    req.params.id as string,
    userId,
    input,
    req.clientCert ?? null,
  );
  sendSuccess(res, { podcast }, 'Episódio VOD publicado na biblioteca', 201);
};
