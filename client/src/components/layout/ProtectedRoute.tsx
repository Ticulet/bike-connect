import { Outlet } from 'react-router';

// Stub — redirects to /login when no authenticated user is present
export function ProtectedRoute(): React.JSX.Element {
  return <Outlet />;
}
