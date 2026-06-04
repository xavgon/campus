import type { Podcast, PodcastLibraryFilters } from '@/features/podcasts/types/podcast';

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

export const filterAndSortPodcasts = (
  podcasts: Podcast[],
  { search, categoryId, sort }: PodcastLibraryFilters,
): Podcast[] => {
  const query = normalize(search);
  let result = podcasts.filter((podcast) => {
    if (categoryId && podcast.categoryId !== categoryId) return false;
    if (!query) return true;
    const haystack = normalize(
      `${podcast.title} ${podcast.description} ${podcast.categoryName}`,
    );
    return haystack.includes(query);
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title-asc':
        return a.title.localeCompare(b.title, 'pt');
      case 'title-desc':
        return b.title.localeCompare(a.title, 'pt');
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return result;
};
