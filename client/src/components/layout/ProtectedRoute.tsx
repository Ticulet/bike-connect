import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../features/auth/hooks/useAuth.js';

export function ProtectedRoute(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading" role="status" aria-label="Loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
