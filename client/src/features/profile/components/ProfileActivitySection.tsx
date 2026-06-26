import { useCallback, useEffect, useState } from 'react';
import { fetchUserActivity } from '@/features/auth/services/auth.service';
import type { UserActivityRow } from '@/features/auth/types/auth.types';
import { ProfileSection } from '@/features/profile/components/ProfileSection';
import { formatAdminDate } from '@/features/admin/utils/formatAdminDate';
import { getApiErrorMessage } from '@/shared/api/client';
import { Alert } from '@/shared/components/campus/Alert';
import { CampusPagination } from '@/shared/components/campus/CampusPagination';
import { Button } from '@/shared/components/ui/Button';
import { LIST_PAGE_SIZE } from '@/shared/constants/pagination';
import { ACTIVITY_COPY, ERROR_TITLES } from '@/shared/copy/campusMessages';
import { useClientPagination } from '@/shared/hooks/useClientPagination';

export const ProfileActivitySection = () => {
  const [logs, setLogs] = useState<UserActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await fetchUserActivity();
      setLogs(result.data.logs);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const { items: visibleLogs, page, setPage, totalPages } = useClientPagination(logs, LIST_PAGE_SIZE);

  return (
    <ProfileSection
      title={ACTIVITY_COPY.sectionTitle}
      description={ACTIVITY_COPY.sectionDescription}
    >
      {error && <Alert title={ERROR_TITLES.load} message={error} />}

      <div className="mb-4 flex justify-end">
        <Button type="button" variant="outline" className="!py-2 text-xs" onClick={() => void load()}>
          {ACTIVITY_COPY.refresh}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-campus-muted">{ACTIVITY_COPY.loading}</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-campus-muted">{ACTIVITY_COPY.empty}</p>
      ) : (
        <div className="space-y-4">
          <ul className="divide-y divide-campus-border/60">
            {visibleLogs.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-campus-foreground">{row.action}</span>
                <div className="flex flex-wrap items-center gap-2 text-xs text-campus-muted">
                  <time dateTime={row.created_at}>{formatAdminDate(row.created_at)}</time>
                  {row.cert_cn && (
                    <span className="rounded-none border border-campus-border/80 px-1.5 py-0.5 font-mono">
                      {row.cert_cn}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <CampusPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            ariaLabel="Paginação de actividade"
            className="border-t border-campus-border/50 pt-4"
          />
        </div>
      )}
    </ProfileSection>
  );
};
