import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canPublishPodcasts } from '@/features/auth/utils/canPublish';
import { PodcastCard } from '@/features/podcasts/components/PodcastCard';
import { PodcastListSkeleton } from '@/features/podcasts/components/PodcastListSkeleton';
import { PodcastPagination } from '@/features/podcasts/components/PodcastPagination';
import { PodcastsEmptyState } from '@/features/podcasts/components/PodcastsEmptyState';
import { PodcastsStats } from '@/features/podcasts/components/PodcastsStats';
import { PodcastsToolbar } from '@/features/podcasts/components/PodcastsToolbar';
import { usePodcastCategories } from '@/features/podcasts/hooks/usePodcastCategories';
import { usePodcastsLibrary } from '@/features/podcasts/hooks/usePodcastsLibrary';
import { ProfileNotice } from '@/features/profile/components/ProfileNotice';
import { PageHeader } from '@/shared/components/campus/PageHeader';
import { ERROR_TITLES, SEARCH_COPY } from '@/shared/copy/campusMessages';
import { Alert } from '@/shared/components/campus/Alert';
import { Button } from '@/shared/components/ui/Button';

export const PodcastsLibraryPage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const canPublish = canPublishPodcasts(user);
  const publishNotice = (location.state as { notice?: string } | null)?.notice;

  const {
    filtered,
    podcasts,
    pagination,
    page,
    setPage,
    isLoading,
    isFetching,
    isSearching,
    error,
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
  const { categories, isLoading: categoriesLoading } = usePodcastCategories();

  return (
    <div className="campus-page-enter space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          eyebrow="Biblioteca"
          title="Os meus podcasts"
          description="Gere episódios, capas e metadados. Pesquisa, filtra por categoria e acompanha o estado de cada publicação."
        />
        {canPublish && (
          <Link to="/podcasts/new" className="shrink-0">
            <Button className="w-full sm:w-auto">Publicar episódio</Button>
          </Link>
        )}
      </div>

      {publishNotice && (
        <ProfileNotice title="Publicado" message={publishNotice} variant="success" />
      )}

      {error && <Alert title={ERROR_TITLES.load} message={error} />}

      {!isEmptyLibrary && <PodcastsStats {...stats} />}

      {!isEmptyLibrary && (
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

      {!isLoading && isEmptyLibrary && (
        <PodcastsEmptyState variant="library" canPublish={canPublish} />
      )}

      {!isLoading && isEmptyResults && (
        <PodcastsEmptyState variant="filters" onClearFilters={clearFilters} />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
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
