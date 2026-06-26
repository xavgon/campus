import { useEffect, useMemo, useState } from 'react';

export const useClientPagination = <T,>(items: T[], pageSize: number) => {
  const [page, setPage] = useState(1);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, pageSize, safePage],
  );

  return {
    page: safePage,
    setPage,
    totalPages,
    total,
    items: paginatedItems,
    hasMultiplePages: totalPages > 1,
  };
};
