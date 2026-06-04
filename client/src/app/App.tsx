import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { AdminRoute } from '@/features/admin/components/AdminRoute';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ExplorePage } from '@/pages/explore/ExplorePage';
import { HomePage } from '@/pages/home/HomePage';
import { PodcastNewPage } from '@/pages/podcasts/PodcastNewPage';
import { PodcastsPage } from '@/pages/podcasts/PodcastsPage';
import {
  AdminLogsPage,
  AdminOverviewPage,
  AdminPostsPage,
  AdminTransmissionsPage,
  AdminUsersPage,
} from '@/pages/admin/AdminPages';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { MainLayout } from '@/shared/layouts/MainLayout';
import { MarketingLayout } from '@/shared/layouts/MarketingLayout';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explorar" element={<ExplorePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/podcasts" element={<PodcastsPage />} />
            <Route path="/podcasts/new" element={<PodcastNewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminOverviewPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/posts" element={<AdminPostsPage />} />
                <Route path="/admin/transmissions" element={<AdminTransmissionsPage />} />
                <Route path="/admin/logs" element={<AdminLogsPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
