import { useCallback, useEffect, useState } from 'react';
import { fetchAdminCategories, fetchAdminUsers } from '@/features/admin/services/admin.service';
import type { AdminCategory, AdminUserRow } from '@/features/admin/types/admin.types';
import { getApiErrorMessage } from '@/shared/api/client';

export const useAdminLookups = () => {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [userList, categoryList] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminCategories(),
      ]);
      setUsers(userList);
      setCategories(categoryList);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { users, categories, isLoading, error, reload };
};
