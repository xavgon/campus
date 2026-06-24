import type { PodcastCategory, PodcastLibraryFilters, PodcastSort } from '@/features/podcasts/types/podcast';
import { Field } from '@/shared/components/campus/Field';
import { Button } from '@/shared/components/ui/Button';

const SORT_OPTIONS: { value: PodcastSort; label: string }[] = [
  { value: 'newest', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'title-asc', label: 'Título A–Z' },
  { value: 'title-desc', label: 'Título Z–A' },
];

const selectClass =
  'w-full rounded-none border border-campus-border bg-campus-surface-elevated px-4 py-3 text-sm text-campus-foreground outline-none transition focus:border-campus-primary focus:ring-2 focus:ring-campus-primary/30';

interface PodcastsToolbarProps {
  filters: PodcastLibraryFilters;
  categories: PodcastCategory[];
  categoriesLoading?: boolean;
  resultCount: number;
  hasActiveFilters: boolean;
  isSearching?: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: PodcastSort) => void;
  onClearFilters: () => void;
}

export const PodcastsToolbar = ({
  filters,
  categories,
  categoriesLoading = false,
  resultCount,
  hasActiveFilters,
  isSearching = false,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onClearFilters,
}: PodcastsToolbarProps) => (
  <div className="campus-panel p-5 sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 flex-1 lg:max-w-md">
        <Field
          label="Pesquisar"
          name="podcastSearch"
          type="search"
          placeholder="Título, descrição ou autor…"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:w-auto lg:min-w-[20rem]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="podcastCategory" className="text-sm font-medium text-campus-foreground">
            Categoria
          </label>
          <select
            id="podcastCategory"
            className={selectClass}
            value={filters.categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={categoriesLoading}
          >
            <option value="">{categoriesLoading ? 'A carregar…' : 'Todas'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="podcastSort" className="text-sm font-medium text-campus-foreground">
            Ordenar
          </label>
          <select
            id="podcastSort"
            className={selectClass}
            value={filters.sort}
            onChange={(e) => onSortChange(e.target.value as PodcastSort)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-campus-border/50 pt-4">
      <p className="text-sm text-campus-accent">
        <span className="font-semibold text-campus-foreground">{resultCount}</span>
        {resultCount === 1 ? ' episódio' : ' episódios'}
        {hasActiveFilters ? ' com os filtros actuais' : ''}
        {isSearching ? ' · a pesquisar…' : ''}
      </p>
      {hasActiveFilters && (
        <Button type="button" variant="ghost" className="!py-2 text-xs" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      )}
    </div>
  </div>
);
