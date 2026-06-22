import { Navigate } from 'react-router-dom';
import { AuthFormSkeleton } from '@/features/auth/components/AuthFormSkeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';

/** No desktop, a raiz abre login (ou dashboard se já houver sessão). */
export const ElectronRootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthFormSkeleton />;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};
