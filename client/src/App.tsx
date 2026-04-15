import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider } from './features/auth/context/AuthProvider.js';
import { LoginPage } from './features/auth/pages/LoginPage.js';
import { SettingsPage } from './features/auth/pages/SettingsPage.js';
import { Layout } from './components/layout/Layout.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { HomePage } from './pages/HomePage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { UserProfilePage } from './pages/UserProfilePage.js';
import { PostListPage } from './features/blog/pages/PostListPage.js';
import { PostDetailPage } from './features/blog/pages/PostDetailPage.js';
import { PostCreatePage } from './features/blog/pages/PostCreatePage.js';
import { PostEditPage } from './features/blog/pages/PostEditPage.js';
import { MyPostsPage } from './features/blog/pages/MyPostsPage.js';
import { MyBikesPage } from './features/bikes/pages/MyBikesPage.js';
import { BikeCreatePage } from './features/bikes/pages/BikeCreatePage.js';
import { BikeDetailPage } from './features/bikes/pages/BikeDetailPage.js';
import { BikeEditPage } from './features/bikes/pages/BikeEditPage.js';
import { PublicBikePage } from './features/bikes/pages/PublicBikePage.js';

function Placeholder({ title }: { title: string }): React.JSX.Element {
  return (
    <article>
      <h1>{title}</h1>
    </article>
  );
}

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route index element={<HomePage />} />
            <Route path="posts" element={<PostListPage />} />
            <Route
              path="posts/:slug"
              element={<PostDetailPage />}
            />
            <Route
              path="users/:id"
              element={<UserProfilePage />}
            />
            <Route
              path="bikes/:id"
              element={<PublicBikePage />}
            />
            <Route path="login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="dashboard"
                element={<Placeholder title="Dashboard" />}
              />
              <Route
                path="my-posts"
                element={<MyPostsPage />}
              />
              <Route
                path="posts/new"
                element={<PostCreatePage />}
              />
              <Route
                path="posts/:id/edit"
                element={<PostEditPage />}
              />
              <Route
                path="my-bikes"
                element={<MyBikesPage />}
              />
              <Route
                path="my-bikes/new"
                element={<BikeCreatePage />}
              />
              <Route
                path="my-bikes/:id"
                element={<BikeDetailPage />}
              />
              <Route
                path="my-bikes/:id/edit"
                element={<BikeEditPage />}
              />
              <Route
                path="my-bikes/:bikeId/maintenance/new"
                element={<Placeholder title="New Maintenance" />}
              />
              <Route
                path="my-bikes/:bikeId/maintenance/:logId/edit"
                element={<Placeholder title="Edit Maintenance" />}
              />
              <Route
                path="settings"
                element={<SettingsPage />}
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
