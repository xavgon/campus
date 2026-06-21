import { TriangleMeshBackground } from '@/shared/components/campus/TriangleMeshBackground';
import type { MarketingBackground } from '@/shared/layouts/marketingMeta';

interface PageBackgroundProps {
  background: MarketingBackground;
  routeKey: string;
}

export const PageBackground = ({ background, routeKey }: PageBackgroundProps) => (
  <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
    <div
      key={routeKey}
      className="campus-bg-image absolute inset-0 bg-cover bg-no-repeat"
      style={{
        backgroundImage: `url('${background.src}')`,
        backgroundPosition: background.position ?? 'center',
      }}
    />
    <div
      className={`absolute inset-0 z-1 bg-linear-to-br ${background.overlayClass ?? 'from-black/80 via-campus-surface-dark/75 to-black/92'}`}
    />
    <TriangleMeshBackground />
  </div>
);
