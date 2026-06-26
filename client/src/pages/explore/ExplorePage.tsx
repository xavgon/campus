import { Link } from 'react-router-dom';
import { PublicPodcastCard } from '@/features/explore/components/PublicPodcastCard';
import { usePublicPodcastsExplore } from '@/features/explore/hooks/usePublicPodcastsExplore';
import { PodcastListSkeleton } from '@/features/podcasts/components/PodcastListSkeleton';
import { PodcastPagination } from '@/features/podcasts/components/PodcastPagination';
import { PodcastsToolbar } from '@/features/podcasts/components/PodcastsToolbar';
import { Alert } from '@/shared/components/campus/Alert';
import { Button } from '@/shared/components/ui/Button';
import { ERROR_TITLES, SEARCH_COPY } from '@/shared/copy/campusMessages';

export const ExplorePage = () => {
  const {
    filtered,
    podcasts,
    pagination,
    page,
    setPage,
    categories,
    categoriesLoading,
    isLoading,
    isFetching,
    isSearching,
    error,
    filters,
    setSearch,
    setCategoryId,
    setSort,
    clearFilters,
    hasActiveFilters,
    isEmptyCatalog,
    isEmptyResults,
  } = usePublicPodcastsExplore();

  return (
    <div className="campus-page-enter w-full space-y-8">
      <header className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-campus-primary">Catálogo</p>
        <h1 className="mt-2 text-3xl font-bold text-campus-foreground sm:text-4xl">
          {SEARCH_COPY.exploreTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-campus-accent sm:text-base">
          {SEARCH_COPY.exploreDescription}
        </p>
      </header>

      {error && <Alert title={ERROR_TITLES.load} message={error} />}

      {!isEmptyCatalog && (
        <PodcastsToolbar
          filters={filters}
          categories={categories}
          categoriesLoading={categoriesLoading}
          resultCount={pagination.total}
          hasActiveFilters={hasActiveFilters}
          isSearching={isSearching || (isFetching && podcasts.length > 0)}
          searchPlaceholder={SEARCH_COPY.placeholder}
          onSearchChange={setSearch}
          onCategoryChange={setCategoryId}
          onSortChange={setSort}
          onClearFilters={clearFilters}
        />
      )}

      {isLoading && <PodcastListSkeleton />}

      {!isLoading && isEmptyCatalog && (
        <div className="campus-panel border-dashed p-8 text-center">
          <p className="text-sm text-campus-muted">{SEARCH_COPY.publicEmpty}</p>
          <Link to="/register" className="mt-4 inline-block">
            <Button variant="outline">Criar conta de criador</Button>
          </Link>
        </div>
      )}

      {!isLoading && isEmptyResults && (
        <div className="campus-panel border-dashed p-8 text-center">
          <p className="text-sm text-campus-muted">{SEARCH_COPY.publicEmptyFilters}</p>
          <Button type="button" variant="ghost" className="mt-4" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((podcast) => (
              <PublicPodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
          <PodcastPagination
            page={page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            onPageChange={setPage}
            disabled={isFetching}
          />
        </div>
      )}
    </div>
  );
};
