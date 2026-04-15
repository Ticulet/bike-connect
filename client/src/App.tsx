import { BrowserRouter, Route, Routes } from 'react-router';
import { Layout } from './components/layout/Layout.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { HomePage } from './pages/HomePage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

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
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="posts" element={<Placeholder title="Post List" />} />
          <Route
            path="posts/:slug"
            element={<Placeholder title="Post Detail" />}
          />
          <Route
            path="users/:id"
            element={<Placeholder title="User Profile" />}
          />
          <Route
            path="bikes/:id"
            element={<Placeholder title="Bike Detail" />}
          />
          <Route path="login" element={<Placeholder title="Login" />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="dashboard"
              element={<Placeholder title="Dashboard" />}
            />
            <Route
              path="my-posts"
              element={<Placeholder title="My Posts" />}
            />
            <Route
              path="posts/new"
              element={<Placeholder title="New Post" />}
            />
            <Route
              path="posts/:id/edit"
              element={<Placeholder title="Edit Post" />}
            />
            <Route
              path="my-bikes"
              element={<Placeholder title="My Bikes" />}
            />
            <Route
              path="my-bikes/new"
              element={<Placeholder title="New Bike" />}
            />
            <Route
              path="my-bikes/:id"
              element={<Placeholder title="Bike Detail (Owner)" />}
            />
            <Route
              path="my-bikes/:id/edit"
              element={<Placeholder title="Edit Bike" />}
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
              element={<Placeholder title="Settings" />}
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
