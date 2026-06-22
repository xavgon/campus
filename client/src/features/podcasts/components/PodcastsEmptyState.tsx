import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';

interface PodcastsEmptyStateProps {
  variant: 'library' | 'filters';
  canPublish?: boolean;
  onClearFilters?: () => void;
}

export const PodcastsEmptyState = ({
  variant,
  canPublish = false,
  onClearFilters,
}: PodcastsEmptyStateProps) => (
  <div className="campus-panel flex flex-col items-center px-6 py-12 text-center sm:py-16">
    <div
      className="mb-6 flex h-16 w-16 items-center justify-center rounded-none border border-campus-border/80 bg-black/30"
      aria-hidden
    >
      <svg
        className="h-8 w-8 text-campus-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="square"
          d="M9 18V5l12-2v13M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm12-2c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"
        />
      </svg>
    </div>

    {variant === 'library' ? (
      <>
        <h2 className="text-xl font-bold text-campus-foreground">Ainda não tens episódios</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-campus-accent">
          {canPublish
            ? 'Publica o teu primeiro podcast com áudio e metadados. Os episódios aparecem aqui automaticamente.'
            : 'Ainda não há episódios na tua biblioteca. Contacta um administrador se precisares de permissão para publicar.'}
        </p>
        {canPublish && (
          <Link to="/podcasts/new" className="mt-6">
            <Button>Publicar primeiro episódio</Button>
          </Link>
        )}
      </>
    ) : (
      <>
        <h2 className="text-xl font-bold text-campus-foreground">Nenhum resultado</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-campus-accent">
          Não encontrámos episódios com esta pesquisa ou filtros. Tenta outras palavras ou limpa os
          filtros.
        </p>
        {onClearFilters && (
          <Button type="button" variant="outline" className="mt-6" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        )}
      </>
    )}
  </div>
);
