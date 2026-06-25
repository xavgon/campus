import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { AdminRoute } from '@/features/admin/components/AdminRoute';
import { CreatorRoute } from '@/features/auth/components/CreatorRoute';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ExplorePage } from '@/pages/explore/ExplorePage';
import { HomePage } from '@/pages/home/HomePage';
import { PodcastNewPage } from '@/pages/podcasts/PodcastNewPage';
import { PodcastDetailPage } from '@/pages/podcasts/PodcastDetailPage';
import { PodcastsPage } from '@/pages/podcasts/PodcastsPage';
import {
  AdminLogsPage,
  AdminNotificationsPage,
  AdminOverviewPage,
  AdminPostsPage,
  AdminTransmissionsPage,
  AdminUsersPage,
} from '@/pages/admin/AdminPages';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { LiveBroadcastPage } from '@/features/live/pages/LiveBroadcastPage';
import { LiveHubPage } from '@/features/live/pages/LiveHubPage';
import { LiveWatchPage } from '@/features/live/pages/LiveWatchPage';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { MarketingLayout } from '@/shared/layouts/MarketingLayout';
import { ElectronShell } from '@/shared/layouts/ElectronShell';
import { IS_ELECTRON } from '@/shared/utils/isElectron';
import { ElectronRootRedirect } from '@/app/ElectronRootRedirect';
import { ApiBootstrap } from '@/app/ApiBootstrap';
import { ApiToastProvider } from '@/shared/context/ApiToastContext';

const AppRoutes = () => (
  <Routes>
    <Route element={<MarketingLayout />}>
      <Route path="/" element={IS_ELECTRON ? <ElectronRootRedirect /> : <HomePage />} />
      <Route path="/explorar" element={<ExplorePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Route>

    <Route element={<MainLayout />}>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/podcasts" element={<PodcastsPage />} />
        <Route element={<CreatorRoute />}>
          <Route path="/podcasts/new" element={<PodcastNewPage />} />
        </Route>
        <Route path="/podcasts/:id" element={<PodcastDetailPage />} />
        <Route path="/live" element={<LiveHubPage />} />
        <Route element={<CreatorRoute />}>
          <Route path="/live/broadcast" element={<LiveBroadcastPage />} />
        </Route>
        <Route path="/live/:id" element={<LiveWatchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/posts" element={<AdminPostsPage />} />
            <Route path="/admin/transmissions" element={<AdminTransmissionsPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
          </Route>
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to={IS_ELECTRON ? '/login' : '/'} replace />} />
  </Routes>
);

const AppRouter = IS_ELECTRON ? HashRouter : BrowserRouter;

const App = () => (
  <AuthProvider>
    <ApiToastProvider>
      <AppRouter>
        <ApiBootstrap />
        {IS_ELECTRON ? (
          <ElectronShell>
            <AppRoutes />
          </ElectronShell>
        ) : (
          <AppRoutes />
        )}
      </AppRouter>
    </ApiToastProvider>
  </AuthProvider>
);

export default App;
