import { CampusPagination } from '@/shared/components/campus/CampusPagination';

interface PodcastPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const PodcastPagination = ({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: PodcastPaginationProps) => (
  <CampusPagination
    page={page}
    totalPages={totalPages}
    onPageChange={onPageChange}
    disabled={disabled}
    ariaLabel="Paginação de episódios"
    className="border-t border-campus-border/50 pt-4"
  />
);
