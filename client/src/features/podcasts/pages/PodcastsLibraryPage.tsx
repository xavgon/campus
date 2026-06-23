import { Link } from 'react-router-dom';
import { PodcastCard } from '@/features/podcasts/components/PodcastCard';
import { PodcastListSkeleton } from '@/features/podcasts/components/PodcastListSkeleton';
import { PodcastsEmptyState } from '@/features/podcasts/components/PodcastsEmptyState';
import { PodcastsStats } from '@/features/podcasts/components/PodcastsStats';
import { PodcastsToolbar } from '@/features/podcasts/components/PodcastsToolbar';
import { usePodcastsLibrary } from '@/features/podcasts/hooks/usePodcastsLibrary';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { Button } from '@/shared/components/ui/Button';

export const PodcastsLibraryPage = () => {
  const {
    filtered,
    isLoading,
    filters,
    stats,
    setSearch,
    setCategoryId,
    setSort,
    clearFilters,
    hasActiveFilters,
    isEmptyLibrary,
    isEmptyResults,
  } = usePodcastsLibrary();

  return (
    <div className="campus-page-enter space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Biblioteca"
          title="Os meus podcasts"
          description="Gere episódios, capas e metadados. Pesquisa, filtra por categoria e acompanha o estado de cada publicação."
        />
        <Link to="/podcasts/new" className="shrink-0">
          <Button className="w-full sm:w-auto">Publicar episódio</Button>
        </Link>
      </div>

      {!isEmptyLibrary && <PodcastsStats {...stats} />}

      {!isEmptyLibrary && (
        <PodcastsToolbar
          filters={filters}
          resultCount={filtered.length}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearch}
          onCategoryChange={setCategoryId}
          onSortChange={setSort}
          onClearFilters={clearFilters}
        />
      )}

      {isLoading && <PodcastListSkeleton />}

      {!isLoading && isEmptyLibrary && <PodcastsEmptyState variant="library" />}

      {!isLoading && isEmptyResults && (
        <PodcastsEmptyState variant="filters" onClearFilters={clearFilters} />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  );
};
