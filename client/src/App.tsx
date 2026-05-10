import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './features/auth/context/AuthProvider.js';
import { LoginPage } from './features/auth/pages/LoginPage.js';
import { SettingsPage } from './features/auth/pages/SettingsPage.js';
import { Layout } from './components/layout/Layout.js';
import { MeLayout } from './components/layout/MeLayout.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { LegacyRedirect } from './components/routing/LegacyRedirect.js';
import { HomePage } from './pages/HomePage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { UserProfilePage } from './pages/UserProfilePage.js';
import { PostListPage } from './features/blog/pages/PostListPage.js';
import { PostDetailPage } from './features/blog/pages/PostDetailPage.js';
import { PostCreatePage } from './features/blog/pages/PostCreatePage.js';
import { PostEditPage } from './features/blog/pages/PostEditPage.js';
import { MyPostsPage } from './features/blog/pages/MyPostsPage.js';
import { BookmarksPage } from './features/blog/pages/BookmarksPage.js';
import { MyBikesPage } from './features/bikes/pages/MyBikesPage.js';
import { BikeCreatePage } from './features/bikes/pages/BikeCreatePage.js';
import { BikeDetailPage } from './features/bikes/pages/BikeDetailPage.js';
import { BikeEditPage } from './features/bikes/pages/BikeEditPage.js';
import { PublicBikePage } from './features/bikes/pages/PublicBikePage.js';
import { MaintenanceCreatePage } from './features/maintenance/pages/MaintenanceCreatePage.js';
import { MaintenanceEditPage } from './features/maintenance/pages/MaintenanceEditPage.js';
import { ExploreBikesPage } from './features/bikes/pages/ExploreBikesPage.js';
import { FeedPage } from './features/feed/pages/FeedPage.js';
import { RideCreatePage } from './features/rides/pages/RideCreatePage.js';
import { RideEditPage } from './features/rides/pages/RideEditPage.js';

// TODO: replace with real MeHubPage once the personal hub index is built.
const MeHubPage = (): React.JSX.Element => (
  <div>Hub — coming soon.</div>
);

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route index element={<HomePage />} />
            <Route path="posts" element={<PostListPage />} />
            <Route path="posts/:slug" element={<PostDetailPage />} />
            <Route path="users/:id" element={<UserProfilePage />} />
            <Route path="bikes/:id" element={<PublicBikePage />} />
            <Route path="explore/bikes" element={<ExploreBikesPage />} />
            <Route path="login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              {/* /feed stays outside the /me layout */}
              <Route path="feed" element={<FeedPage />} />

              {/* /me/* wrapped in MeLayout shell */}
              <Route element={<MeLayout />}>
                <Route path="me" element={<MeHubPage />} />
                <Route path="me/posts" element={<MyPostsPage />} />
                <Route path="me/posts/new" element={<PostCreatePage />} />
                <Route path="me/posts/:id/edit" element={<PostEditPage />} />
                <Route path="me/bikes" element={<MyBikesPage />} />
                <Route path="me/bikes/new" element={<BikeCreatePage />} />
                <Route path="me/bikes/:id" element={<BikeDetailPage />} />
                <Route path="me/bikes/:id/edit" element={<BikeEditPage />} />
                <Route
                  path="me/bikes/:bikeId/maintenance/new"
                  element={<MaintenanceCreatePage />}
                />
                <Route
                  path="me/maintenance/:logId/edit"
                  element={<MaintenanceEditPage />}
                />
                <Route
                  path="me/bikes/:bikeId/rides/new"
                  element={<RideCreatePage />}
                />
                <Route
                  path="me/rides/:rideId/edit"
                  element={<RideEditPage />}
                />
                <Route path="me/bookmarks" element={<BookmarksPage />} />
                <Route path="me/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Legacy redirects — all use replace so back button skips legacy URL */}
            <Route path="dashboard" element={<Navigate to="/me" replace />} />
            <Route path="my-posts" element={<Navigate to="/me/posts" replace />} />
            <Route
              path="my-posts/*"
              element={<LegacyRedirect from="/my-posts" to="/me/posts" />}
            />
            <Route path="my-bikes" element={<Navigate to="/me/bikes" replace />} />
            <Route
              path="my-bikes/*"
              element={<LegacyRedirect from="/my-bikes" to="/me/bikes" />}
            />
            <Route
              path="posts/new"
              element={<Navigate to="/me/posts/new" replace />}
            />
            <Route
              path="posts/:id/edit"
              element={
                <LegacyRedirect from="/posts/:id/edit" to="/me/posts/:id/edit" />
              }
            />
            <Route
              path="maintenance/:logId/edit"
              element={
                <LegacyRedirect
                  from="/maintenance/:logId/edit"
                  to="/me/maintenance/:logId/edit"
                />
              }
            />
            <Route
              path="rides/:rideId/edit"
              element={
                <LegacyRedirect
                  from="/rides/:rideId/edit"
                  to="/me/rides/:rideId/edit"
                />
              }
            />
            <Route
              path="settings"
              element={<Navigate to="/me/settings" replace />}
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
