import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext } from '@/features/auth/context/auth-context';
import * as authApi from '@/features/auth/services/auth.service';
import { sendPresenceLeave } from '@/features/presence/services/presence.service';
import type { LoginCredentials, RegisterCredentials, User } from '@/features/auth/types/auth.types';
import { clearToken, getToken, setToken } from '@/shared/utils/storage';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.fetchProfile();
      setUser(response.data.user);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    setToken(response.data.token);
    setUser(response.data.user);
    return response;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await authApi.register(credentials);
    setToken(response.data.token);
    setUser(response.data.user);
    return response;
  }, []);

  const logout = useCallback(() => {
    void sendPresenceLeave().catch(() => {});
    clearToken();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  }, []);

  const becomeCreator = useCallback(async () => {
    const response = await authApi.becomeCreator();
    setToken(response.data.token);
    setUser(response.data.user);
  }, []);

  const leaveCreator = useCallback(async () => {
    const response = await authApi.leaveCreator();
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.deleted;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      becomeCreator,
      leaveCreator,
    }),
    [user, isLoading, login, register, logout, updateUser, becomeCreator, leaveCreator],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
