import { Link } from 'react-router';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import './home-page.css';

export function HomePage(): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <p className="home-hero__eyebrow">
          <span className="home-hero__dot" aria-hidden="true" />
          A field guide for cyclists
        </p>
        <h1 id="home-hero-title" className="home-hero__title">
          Where your <em>bikes</em>,
          <br />
          rides &amp; stories live.
        </h1>
        <p className="home-hero__lead">
          Keep a service history per component, log every ride, and share
          what you learn. Built for riders who care about the details.
        </p>
        <div className="home-hero__actions">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Open your feed
              </Link>
              <Link to="/my-bikes" className="btn btn-outline btn-lg">
                Your bikes
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary btn-lg">
                Sign in with Google
              </Link>
              <Link to="/posts" className="btn btn-outline btn-lg">
                Browse the blog
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="home-features" aria-label="Features">
        <article className="home-feature">
          <div className="home-feature__icon" aria-hidden="true">🚲</div>
          <h2 className="home-feature__title">A bike for every build</h2>
          <p className="home-feature__desc">
            Register each bike with components down to the chain, tires and
            brake pads. Set them public to share, or keep them private.
          </p>
        </article>

        <article className="home-feature">
          <div className="home-feature__icon" aria-hidden="true">🛠️</div>
          <h2 className="home-feature__title">Service history that sticks</h2>
          <p className="home-feature__desc">
            Log maintenance per component. Get smart reminders when it&apos;s
            time for a chain swap or a brake bleed based on your mileage.
          </p>
        </article>

        <article className="home-feature">
          <div className="home-feature__icon" aria-hidden="true">✍️</div>
          <h2 className="home-feature__title">Stories worth sharing</h2>
          <p className="home-feature__desc">
            Write ride reports, reviews and guides with a rich editor. Follow
            other riders, bookmark posts, and build your own reading list.
          </p>
        </article>
      </section>

      <section className="home-cta">
        <h2 className="home-cta__title">Ready to roll?</h2>
        <p className="home-cta__desc">
          {isAuthenticated
            ? 'Head to your dashboard for the latest from riders you follow.'
            : 'Sign in with Google to start tracking your rides and bikes.'}
        </p>
        <Link
          to={isAuthenticated ? '/posts/new' : '/login'}
          className="btn btn-accent btn-lg"
        >
          {isAuthenticated ? 'Write a new post' : 'Get started'}
        </Link>
      </section>
    </div>
  );
}
