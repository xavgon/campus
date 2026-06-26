import { CompressionBadge } from '@/features/podcasts/components/CompressionBadge';
import type { CompressionProgress } from '@/features/podcasts/types/compression';
import type { Podcast } from '@/features/podcasts/types/podcast';
import {
  compressionStateHint,
  getCompressionState,
} from '@/features/podcasts/utils/compressionState';
import { formatFileSize } from '@/features/podcasts/utils/formatFileSize';
import { getCompressionProfileLabel, getExpectedCompressionProfile } from '@/features/podcasts/utils/formatCompressionProfile';
import { formatMediaFormatLabel } from '@/features/podcasts/utils/formatMediaFormat';
import { hasPodcastVideo } from '@/features/podcasts/services/podcast.service';

interface CompressionDetailPanelProps {
  podcast: Podcast;
  progress?: CompressionProgress | null;
}

export const CompressionDetailPanel = ({ podcast, progress }: CompressionDetailPanelProps) => {
  const state = getCompressionState(podcast, progress);
  const withVideo = hasPodcastVideo(podcast);
  const hasSizes = podcast.originalSize != null && podcast.compressedSize != null;
  const savedBytes =
    hasSizes ? podcast.originalSize! - podcast.compressedSize! : 0;
  const savedPercent =
    hasSizes && podcast.originalSize! > 0 && savedBytes > 0
      ? Math.max(0, Math.min(100, podcast.compressionRatio ?? 0))
      : 0;
  const ffmpegPercent = progress?.active ? progress.overall : 0;
  const compressionProfile = getCompressionProfileLabel(
    podcast.mediaFormat,
    withVideo ? 'video' : 'audio',
  );

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
          <div className="flex items-start gap-3 rounded-none border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300"
              aria-hidden
            >
              ✓
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-300">Compressão concluída</p>
              {compressionProfile && (
                <p className="text-sm text-campus-foreground">
                  Formato comprimido:{' '}
                  <span className="font-semibold text-emerald-200">{compressionProfile}</span>
                </p>
              )}
              {savedBytes > 0 ? (
                <p className="text-xs text-campus-accent">
                  Poupança de <span className="font-semibold text-campus-foreground">−{savedPercent}%</span>{' '}
                  ({formatFileSize(savedBytes)} menos que o original)
                </p>
              ) : (
                <p className="text-xs text-campus-accent">
                  Ficheiro optimizado para streaming — tamanho similar ao original.
                </p>
              )}
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
            {podcast.mediaFormat && (
              <div className="rounded-none border border-campus-border/50 bg-black/20 px-3 py-2">
                <dt className="text-xs text-campus-muted">Codec</dt>
                <dd className="font-semibold text-campus-foreground">
                  {formatMediaFormatLabel(podcast.mediaFormat)}
                </dd>
              </div>
            )}
            {podcast.compressionRatio != null && (
              <div className="rounded-none border border-campus-border/50 bg-black/20 px-3 py-2">
                <dt className="text-xs text-campus-muted">Redução</dt>
                <dd className="font-semibold text-campus-foreground">
                  {podcast.compressionRatio > 0 ? `−${podcast.compressionRatio}%` : '—'}
                </dd>
              </div>
            )}
            {podcast.processingTimeMs != null && podcast.processingTimeMs > 0 && (
              <div className="rounded-none border border-campus-border/50 bg-black/20 px-3 py-2 sm:col-span-2">
                <dt className="text-xs text-campus-muted">Tempo FFmpeg</dt>
                <dd className="font-semibold text-campus-foreground">
                  {(podcast.processingTimeMs / 1000).toFixed(1)} s
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {state === 'processing' && (
        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-campus-muted">
              <span>Progresso FFmpeg</span>
              <span className="font-semibold text-amber-300">
                {progress?.active ? `${ffmpegPercent}%` : 'A iniciar…'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-none bg-black/40">
              <div
                className={`h-full bg-linear-to-r from-amber-500 to-amber-300 transition-all duration-500 ${
                  progress?.active ? '' : 'w-[12%] animate-pulse'
                }`}
                style={progress?.active ? { width: `${ffmpegPercent}%` } : undefined}
                role="progressbar"
                aria-valuenow={ffmpegPercent}
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
            <div className="space-y-1 text-xs text-campus-muted">
              <p>Tamanho enviado: {formatFileSize(podcast.originalSize)}</p>
              {!withVideo && (
                <p>
                  Destino FFmpeg:{' '}
                  <span className="font-medium text-campus-foreground">
                    {getExpectedCompressionProfile(podcast.mediaFormat)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
