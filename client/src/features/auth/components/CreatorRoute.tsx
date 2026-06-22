import { Navigate, Outlet } from 'react-router-dom';
import { AuthFormSkeleton } from '@/features/auth/components/AuthFormSkeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { canPublishPodcasts } from '@/features/auth/utils/canPublish';

export const CreatorRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AuthFormSkeleton />;
  }

  if (!canPublishPodcasts(user)) {
    return <Navigate to="/podcasts" replace />;
  }

  return <Outlet />;
};
