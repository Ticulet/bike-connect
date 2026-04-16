import { Link, Navigate } from 'react-router';
import { LoginButton } from '../components/LoginButton.js';
import { useAuth } from '../hooks/useAuth.js';
import './login.css';

export function LoginPage(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="login-loading" role="status" aria-label="Loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <section className="login-page__intro" aria-labelledby="login-welcome">
        <p className="login-page__eyebrow">
          <span className="login-page__dot" aria-hidden="true" />
          Welcome
        </p>
        <h1 id="login-welcome" className="login-page__title">
          Sign in to <em>Bike Connect</em>.
        </h1>
        <p className="login-page__lead">
          Track your bikes, log rides, and share what you learn with a
          community of cyclists who care about the details.
        </p>

        <ul className="login-page__features" aria-label="What you get">
          <li>
            <span className="login-page__feature-icon" aria-hidden="true">🚲</span>
            <div>
              <strong>Bike registry</strong>
              <span>Components, photos, public or private — your call.</span>
            </div>
          </li>
          <li>
            <span className="login-page__feature-icon" aria-hidden="true">🛠️</span>
            <div>
              <strong>Maintenance history</strong>
              <span>Per-component service logs with mileage-based reminders.</span>
            </div>
          </li>
          <li>
            <span className="login-page__feature-icon" aria-hidden="true">✍️</span>
            <div>
              <strong>Stories & discovery</strong>
              <span>Ride reports, reviews, comments — all in one feed.</span>
            </div>
          </li>
        </ul>
      </section>

      <section className="login-page__card" aria-labelledby="login-card-title">
        <h2 id="login-card-title" className="login-page__card-title">
          Get started
        </h2>
        <p className="login-page__card-desc">
          Continue with your Google account. No password to remember,
          no new credentials to manage.
        </p>

        <LoginButton />

        <p className="login-page__legal">
          By continuing, you agree to Bike Connect&apos;s terms and
          acknowledge that your Google display name and avatar will be
          used to create your public profile.
        </p>

        <div className="login-page__divider" aria-hidden="true">
          <span>or</span>
        </div>

        <Link to="/posts" className="login-page__guest-link">
          Browse the blog without signing in
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </div>
  );
}
