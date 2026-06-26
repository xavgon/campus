interface CampusPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export const CampusPagination = ({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  ariaLabel = 'Paginação',
  className = '',
}: CampusPaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((p) => {
    if (totalPages <= 7) return true;
    if (p === 1 || p === totalPages) return true;
    return Math.abs(p - page) <= 1;
  });

  return (
    <nav
      className={`campus-pagination ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="campus-pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
        aria-label="Página anterior"
      >
        ← Anterior
      </button>

      {pages.map((p, index) => {
        const prev = pages[index - 1];
        const showEllipsis = prev != null && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {showEllipsis ? <span className="px-1 text-campus-muted">…</span> : null}
            <button
              type="button"
              className={`campus-pagination__btn campus-pagination__btn--page ${
                p === page ? 'campus-pagination__btn--active' : ''
              }`}
              onClick={() => onPageChange(p)}
              disabled={disabled}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        className="campus-pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Página seguinte"
      >
        Seguinte →
      </button>
    </nav>
  );
};
