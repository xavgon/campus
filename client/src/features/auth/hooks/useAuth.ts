import { useContext } from 'react';
import { AuthContext } from '@/features/auth/context/auth-context';
import { getApiErrorMessage } from '@/shared/api/client';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export const useAuthError = () => getApiErrorMessage;
