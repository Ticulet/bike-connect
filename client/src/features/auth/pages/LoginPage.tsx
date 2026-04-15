import { Navigate } from 'react-router';
import { LoginButton } from '../components/LoginButton.js';
import { useAuth } from '../hooks/useAuth.js';

export function LoginPage(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading" role="status" aria-label="Loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main id="main">
      <article className="login-page">
        <h1>Bike Connect</h1>
        <p>
          Your home for bicycle blogs, bike registries, and maintenance
          tracking. Sign in to get started.
        </p>
        <LoginButton />
      </article>
    </main>
  );
}
