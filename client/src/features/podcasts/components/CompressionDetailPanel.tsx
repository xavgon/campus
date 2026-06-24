import { CompressionBadge } from '@/features/podcasts/components/CompressionBadge';
import type { CompressionProgress } from '@/features/podcasts/types/compression';
import type { Podcast } from '@/features/podcasts/types/podcast';
import {
  compressionStateHint,
  getCompressionState,
} from '@/features/podcasts/utils/compressionState';
import { formatFileSize } from '@/features/podcasts/utils/formatFileSize';
import { hasPodcastVideo } from '@/features/podcasts/services/podcast.service';

interface CompressionDetailPanelProps {
  podcast: Podcast;
  progress?: CompressionProgress | null;
}

export const CompressionDetailPanel = ({ podcast, progress }: CompressionDetailPanelProps) => {
  const state = getCompressionState(podcast);
  const withVideo = hasPodcastVideo(podcast);
  const hasSizes = podcast.originalSize != null && podcast.compressedSize != null;
  const savedPercent =
    hasSizes && podcast.originalSize! > 0
      ? Math.max(0, Math.min(100, podcast.compressionRatio ?? 0))
      : 0;
  const compressedShare =
    hasSizes && podcast.originalSize! > 0
      ? Math.round((podcast.compressedSize! / podcast.originalSize!) * 100)
      : 0;

  return (
    <section className="campus-panel space-y-4 p-5" aria-label="Estado da compressão">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-campus-muted">
          Compressão
        </h2>
        <CompressionBadge state={state} />
      </div>

      <p className="text-sm text-campus-accent">{compressionStateHint(state, withVideo)}</p>

      {state === 'complete' && hasSizes && (
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-campus-muted">
              <span>Tamanho final vs. original</span>
              <span className="font-semibold text-emerald-300">−{savedPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-none bg-black/40">
              <div
                className="h-full bg-linear-to-r from-campus-primary to-emerald-400 transition-all"
                style={{ width: `${compressedShare}%` }}
                role="progressbar"
                aria-valuenow={compressedShare}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Ficheiro comprimido ocupa ${compressedShare}% do tamanho original`}
              />
            </div>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-none border border-campus-border/50 bg-black/20 px-3 py-2">
              <dt className="text-xs text-campus-muted">Original</dt>
              <dd className="font-semibold text-campus-foreground">
                {formatFileSize(podcast.originalSize!)}
              </dd>
            </div>
            <div className="rounded-none border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <dt className="text-xs text-campus-muted">Comprimido</dt>
              <dd className="font-semibold text-emerald-300">
                {formatFileSize(podcast.compressedSize!)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {state === 'processing' && (
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-campus-muted">
              <span>Progresso FFmpeg</span>
              <span className="font-semibold text-amber-300">
                {progress?.active ? `${progress.overall}%` : 'A iniciar…'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-none bg-black/40">
              <div
                className={`h-full bg-linear-to-r from-amber-500 to-amber-300 transition-all duration-500 ${
                  progress?.active ? '' : 'w-[12%] animate-pulse'
                }`}
                style={progress?.active ? { width: `${progress.overall}%` } : undefined}
                role="progressbar"
                aria-valuenow={progress?.overall ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso da compressão FFmpeg"
              />
            </div>
          </div>

          {(progress?.audio != null || progress?.video != null) && (
            <div className="flex flex-wrap gap-4 text-xs text-campus-muted">
              {progress.audio != null && (
                <span>
                  Áudio: <span className="font-semibold text-campus-foreground">{progress.audio}%</span>
                </span>
              )}
              {progress.video != null && (
                <span>
                  Vídeo: <span className="font-semibold text-campus-foreground">{progress.video}%</span>
                </span>
              )}
            </div>
          )}

          {podcast.originalSize != null && (
            <p className="text-xs text-campus-muted">
              Tamanho enviado: {formatFileSize(podcast.originalSize)}
            </p>
          )}
        </div>
      )}
    </section>
  );
};
