import { Link, Navigate } from 'react-router';
import { LoginButton } from '../components/LoginButton.js';
import { useAuth } from '../hooks/useAuth.js';
import './login.css';

function BrandMark(): React.JSX.Element {
  return (
    <svg
      className="login__brand-mark"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="14" cy="34" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="34" cy="34" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14 34L24 16L34 34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 16H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function LoginPage(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="login" id="main">
        <div className="login__loading" role="status" aria-label="Loading">
          <p>Loading&hellip;</p>
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="login" id="main">
      <div className="login__card">
        <BrandMark />
        <p className="login__eyebrow">Welcome back</p>
        <h1 className="login__title display-cover">Sign in to Bike Connect</h1>
        <p className="login__lead">
          Pick up your field journal where you left off.
        </p>
        <LoginButton />
        <p className="login__note">
          We use Google sign-in only. No passwords.{' '}
          <Link to="/privacy">Privacy notes</Link>.
        </p>
      </div>
    </main>
  );
}
